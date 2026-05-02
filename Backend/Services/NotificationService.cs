using Backend.Data;
using Backend.DTOs;
using Backend.Enums;
using Backend.Models;
using Backend.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services;

public class NotificationService : INotificationService
{
    private readonly AppDbContext _dbContext;
    private readonly IEmailService _emailService;

    private sealed record OverdueCreditReminderInfo(
        int CustomerId,
        string FullName,
        string? Email,
        int InvoiceCount,
        decimal Outstanding,
        DateTime OldestInvoiceDate);

    public NotificationService(AppDbContext dbContext, IEmailService emailService)
    {
        _dbContext = dbContext;
        _emailService = emailService;
    }

    public async Task<int> NotifyLowStockAsync()
    {
        var adminUsers = await _dbContext.Users
            .Where(x => x.Role == UserRole.Admin && x.IsActive)
            .ToListAsync();

        var lowStockParts = await _dbContext.Parts
            .AsNoTracking()
            .Where(p => p.StockQuantity < p.ReorderLevel)
            .ToListAsync();

        if (adminUsers.Count == 0 || lowStockParts.Count == 0)
        {
            return 0;
        }

        var notifications = new List<Notification>();

        foreach (var part in lowStockParts)
        {
            foreach (var admin in adminUsers)
            {
                notifications.Add(new Notification
                {
                    UserId = admin.UserId,
                    Type = NotificationType.LowStock,
                    Title = "Low Stock Alert",
                    Message = $"Part {part.PartName} ({part.PartCode}) stock is {part.StockQuantity}, below reorder level {part.ReorderLevel}.",
                    IsRead = false,
                    CreatedAt = DateTime.UtcNow,
                    RelatedEntityType = "Part",
                    RelatedEntityId = part.PartId
                });
            }
        }

        _dbContext.Notifications.AddRange(notifications);
        await _dbContext.SaveChangesAsync();

        return notifications.Count;
    }

    public async Task<int> NotifyLowStockByThresholdAsync(int threshold = 10, double repeatHours = 1)
    {
        var adminUsers = await _dbContext.Users
            .Where(x => x.Role == UserRole.Admin && x.IsActive)
            .ToListAsync();

        var lowStockParts = await _dbContext.Parts
            .AsNoTracking()
            .Where(p => p.StockQuantity < threshold)
            .ToListAsync();

        if (adminUsers.Count == 0 || lowStockParts.Count == 0)
        {
            return 0;
        }

        var notifications = new List<Notification>();

        foreach (var part in lowStockParts)
        {
            // Check when last low-stock notification for this part was created
            var lastNotif = await _dbContext.Notifications
                .AsNoTracking()
                .Where(n => n.RelatedEntityType == "Part" && n.RelatedEntityId == part.PartId && n.Type == NotificationType.LowStock)
                .OrderByDescending(n => n.CreatedAt)
                .FirstOrDefaultAsync();

            if (lastNotif != null && lastNotif.CreatedAt > DateTime.UtcNow.AddHours(-repeatHours))
            {
                // Skip - recently notified within repeat window
                continue;
            }

            foreach (var admin in adminUsers)
            {
                notifications.Add(new Notification
                {
                    UserId = admin.UserId,
                    Type = NotificationType.LowStock,
                    Title = "Low Stock Alert",
                    Message = $"Part {part.PartName} ({part.PartCode}) stock is {part.StockQuantity}, below threshold {threshold}.",
                    IsRead = false,
                    CreatedAt = DateTime.UtcNow,
                    RelatedEntityType = "Part",
                    RelatedEntityId = part.PartId
                });
            }
        }

        if (notifications.Count > 0)
        {
            _dbContext.Notifications.AddRange(notifications);
            await _dbContext.SaveChangesAsync();
        }

        return notifications.Count;
    }

    public async Task<int> NotifyPartLowStockAsync(int partId, int currentQuantity, int threshold = 10)
    {
        if (currentQuantity > threshold) return 0;

        var part = await _dbContext.Parts.AsNoTracking().FirstOrDefaultAsync(p => p.PartId == partId);
        if (part == null) return 0;

        var adminUsers = await _dbContext.Users
            .Where(x => x.Role == UserRole.Admin && x.IsActive)
            .ToListAsync();

        if (adminUsers.Count == 0) return 0;

        var notifications = new List<Notification>();

        foreach (var admin in adminUsers)
        {
            notifications.Add(new Notification
            {
                UserId = admin.UserId,
                Type = NotificationType.LowStock,
                Title = "Low Stock Alert",
                    Message = $"Part {part.PartName} ({part.PartCode}) stock is {currentQuantity}, at or below threshold {threshold}.",
                IsRead = false,
                CreatedAt = DateTime.UtcNow,
                RelatedEntityType = "Part",
                RelatedEntityId = part.PartId
            });
        }

        _dbContext.Notifications.AddRange(notifications);
        await _dbContext.SaveChangesAsync();

        return notifications.Count;
    }

    public async Task<int> CreateOverdueCreditNotificationsAsync(int overdueDays = 30)
    {
        var overdueCustomers = await GetOverdueCreditReminderInfosAsync(overdueDays);
        if (overdueCustomers.Count == 0)
        {
            return 0;
        }

        var recipients = await _dbContext.Users
            .AsNoTracking()
            .Where(x => x.IsActive && (x.Role == UserRole.Admin || x.Role == UserRole.Staff))
            .Select(x => new
            {
                x.UserId,
                x.FullName,
                x.Role
            })
            .ToListAsync();

        var notifications = new List<Notification>();
        var cutoff = DateTime.UtcNow.AddDays(-overdueDays);

        foreach (var customer in overdueCustomers)
        {
            var customerUser = await _dbContext.Customers
                .AsNoTracking()
                .Include(x => x.User)
                .Where(x => x.CustomerId == customer.CustomerId && x.User.IsActive)
                .Select(x => x.User)
                .FirstOrDefaultAsync();

            if (customerUser != null && !await HasRecentOverdueNotificationAsync(customerUser.UserId, customer.CustomerId, cutoff))
            {
                notifications.Add(new Notification
                {
                    UserId = customerUser.UserId,
                    Type = NotificationType.OverdueCredit,
                    Title = "Payment Reminder",
                    Message = $"Your unpaid balance of Rs {customer.Outstanding:N2} has been pending for more than {overdueDays} days. Please clear it as soon as possible.",
                    IsRead = false,
                    CreatedAt = DateTime.UtcNow,
                    RelatedEntityType = "Customer",
                    RelatedEntityId = customer.CustomerId
                });
            }

            foreach (var recipient in recipients)
            {
                if (recipient.UserId == customerUser?.UserId)
                {
                    continue;
                }

                if (await HasRecentOverdueNotificationAsync(recipient.UserId, customer.CustomerId, cutoff))
                {
                    continue;
                }

                notifications.Add(new Notification
                {
                    UserId = recipient.UserId,
                    Type = NotificationType.OverdueCredit,
                    Title = "Overdue Credit Alert",
                    Message = $"Customer {customer.FullName} has unpaid credit of Rs {customer.Outstanding:N2} for more than {overdueDays} days ({customer.InvoiceCount} invoice(s)).",
                    IsRead = false,
                    CreatedAt = DateTime.UtcNow,
                    RelatedEntityType = "Customer",
                    RelatedEntityId = customer.CustomerId
                });
            }
        }

        if (notifications.Count > 0)
        {
            _dbContext.Notifications.AddRange(notifications);
            await _dbContext.SaveChangesAsync();
        }

        return notifications.Count;
    }

    public async Task<int> SendOverdueCreditRemindersAsync(int overdueDays = 30)
    {
        var overdueCustomers = await GetOverdueCreditReminderInfosAsync(overdueDays);

        foreach (var customer in overdueCustomers)
        {
            if (!string.IsNullOrWhiteSpace(customer.Email))
            {
                await _emailService.SendOverdueReminderAsync(customer.Email, customer.FullName, customer.Outstanding);
            }
        }

        await CreateOverdueCreditNotificationsAsync(overdueDays);

        return overdueCustomers.Count;
    }

    private async Task<List<OverdueCreditReminderInfo>> GetOverdueCreditReminderInfosAsync(int overdueDays)
    {
        var cutoffDate = DateTime.UtcNow.AddDays(-overdueDays);

        var overdueInvoices = await _dbContext.SalesInvoices
            .AsNoTracking()
            .Include(x => x.Customer)
                .ThenInclude(c => c.User)
            .Where(s => s.BalanceAmount > 0 && s.InvoiceDate <= cutoffDate)
            .ToListAsync();

        return overdueInvoices
            .GroupBy(x => x.CustomerId)
            .Select(group => new OverdueCreditReminderInfo(
                group.Key,
                group.First().Customer?.User?.FullName ?? "Customer",
                group.First().Customer?.User?.Email,
                group.Count(),
                group.Sum(x => x.BalanceAmount),
                group.Min(x => x.InvoiceDate)))
            .OrderByDescending(x => x.Outstanding)
            .ToList();
    }

    private async Task<bool> HasRecentOverdueNotificationAsync(int userId, int customerId, DateTime cutoff)
    {
        return await _dbContext.Notifications.AsNoTracking().AnyAsync(n =>
            n.UserId == userId &&
            n.Type == NotificationType.OverdueCredit &&
            n.RelatedEntityType == "Customer" &&
            n.RelatedEntityId == customerId &&
            n.CreatedAt >= cutoff);
    }

    public async Task<IEnumerable<NotificationDto>> GetUserNotificationsAsync(int userId, bool? isRead = null)
    {
        var query = _dbContext.Notifications.AsNoTracking().Where(n => n.UserId == userId);
        
        if (isRead.HasValue)
        {
            query = query.Where(n => n.IsRead == isRead.Value);
        }

        return await query.OrderByDescending(n => n.CreatedAt)
            .Select(n => new NotificationDto
            {
                NotificationId = n.NotificationId,
                Type = n.Type.ToString(),
                Title = n.Title,
                Message = n.Message,
                IsRead = n.IsRead,
                CreatedAt = n.CreatedAt
            }).ToListAsync();
    }

    public async Task<bool> MarkAsReadAsync(int notificationId, int userId)
    {
        var notification = await _dbContext.Notifications.FirstOrDefaultAsync(n => n.NotificationId == notificationId && n.UserId == userId);
        if (notification == null) return false;

        notification.IsRead = true;
        await _dbContext.SaveChangesAsync();
        return true;
    }

    public async Task<bool> MarkAllAsReadAsync(int userId)
    {
        var notifications = await _dbContext.Notifications.Where(n => n.UserId == userId && !n.IsRead).ToListAsync();
        if (notifications.Count == 0) return true;

        foreach (var n in notifications) n.IsRead = true;
        await _dbContext.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteNotificationAsync(int notificationId, int userId)
    {
        var notification = await _dbContext.Notifications.FirstOrDefaultAsync(n => n.NotificationId == notificationId && n.UserId == userId);
        if (notification == null) return false;

        _dbContext.Notifications.Remove(notification);
        await _dbContext.SaveChangesAsync();
        return true;
    }
}
