using Backend.Data;
using Backend.DTOs.Appointment;
using Backend.Enums;
using Backend.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services;

public class AppointmentService : IAppointmentService
{
    private readonly AppDbContext _dbContext;

    public AppointmentService(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<AppointmentDto> BookAsync(CreateAppointmentDto request)
    {
        var customerExists = await _dbContext.Customers.AnyAsync(x => x.CustomerId == request.CustomerId);
        if (!customerExists)
        {
            throw new InvalidOperationException("Customer not found.");
        }

        if (request.VehicleId.HasValue)
        {
            var vehicleValid = await _dbContext.Vehicles.AnyAsync(x =>
                x.VehicleId == request.VehicleId.Value && x.CustomerId == request.CustomerId);

            if (!vehicleValid)
            {
                throw new InvalidOperationException("Vehicle not found for this customer.");
            }
        }

        var appointment = new Backend.Models.Appointment
        {
            CustomerId = request.CustomerId,
            VehicleId = request.VehicleId,
            AppointmentDateTime = request.AppointmentDateTime,
            ServiceType = request.ServiceType,
            Description = request.Description,
            Status = AppointmentStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };

        _dbContext.Appointments.Add(appointment);
        await _dbContext.SaveChangesAsync();

        // Create notifications for Admin only
        var customer = await _dbContext.Customers.Include(c => c.User).FirstOrDefaultAsync(c => c.CustomerId == appointment.CustomerId);
        var recipients = await _dbContext.Users.Where(u => u.Role == UserRole.Admin && u.IsActive).ToListAsync();

        if (recipients.Any())
        {
            var notifList = new List<Backend.Models.Notification>();
            var customerName = customer?.User?.FullName ?? "Customer";
            var title = "New appointment booked";
            var message = $"{customerName} booked {appointment.ServiceType} on {appointment.AppointmentDateTime:yyyy-MM-dd HH:mm}";

            foreach (var r in recipients)
            {
                notifList.Add(new Backend.Models.Notification
                {
                    UserId = r.UserId,
                    Type = NotificationType.Appointment,
                    Title = title,
                    Message = message,
                    IsRead = false,
                    CreatedAt = DateTime.UtcNow,
                    RelatedEntityType = "Appointment",
                    RelatedEntityId = appointment.AppointmentId
                });
            }

            _dbContext.Notifications.AddRange(notifList);
            await _dbContext.SaveChangesAsync();
        }

        return new AppointmentDto
        {
            AppointmentId = appointment.AppointmentId,
            CustomerId = appointment.CustomerId,
            VehicleId = appointment.VehicleId,
            AppointmentDateTime = appointment.AppointmentDateTime,
            ServiceType = appointment.ServiceType,
            Description = appointment.Description,
            Status = appointment.Status.ToString(),
            AdminNotes = appointment.AdminNotes,
            StaffId = appointment.StaffId,
            CreatedAt = appointment.CreatedAt
        };
    }

    public async Task<IReadOnlyList<AppointmentDto>> GetByCustomerAsync(int customerId)
    {
        return await _dbContext.Appointments
            .AsNoTracking()
            .Where(x => x.CustomerId == customerId)
            .OrderByDescending(x => x.AppointmentDateTime)
            .Select(x => new AppointmentDto
            {
                AppointmentId = x.AppointmentId,
                CustomerId = x.CustomerId,
                VehicleId = x.VehicleId,
                AppointmentDateTime = x.AppointmentDateTime,
                ServiceType = x.ServiceType,
                Description = x.Description,
                Status = x.Status.ToString(),
                AdminNotes = x.AdminNotes,
                StaffId = x.StaffId,
                CreatedAt = x.CreatedAt
            })
            .ToListAsync();
    }

    public async Task<IReadOnlyList<AppointmentDto>> GetAllAsync()
    {
        return await _dbContext.Appointments
            .AsNoTracking()
            .OrderByDescending(x => x.AppointmentDateTime)
            .Select(x => new AppointmentDto
            {
                AppointmentId = x.AppointmentId,
                CustomerId = x.CustomerId,
                VehicleId = x.VehicleId,
                AppointmentDateTime = x.AppointmentDateTime,
                ServiceType = x.ServiceType,
                Description = x.Description,
                Status = x.Status.ToString(),
                AdminNotes = x.AdminNotes,
                StaffId = x.StaffId,
                CreatedAt = x.CreatedAt
            })
            .ToListAsync();
    }

    public async Task<AppointmentDto?> UpdateStatusAsync(int appointmentId, string status, int? staffId = null, string? adminNotes = null)
    {
        var appointment = await _dbContext.Appointments.FirstOrDefaultAsync(x => x.AppointmentId == appointmentId);
        if (appointment == null)
        {
            return null;
        }

        var oldStatus = appointment.Status;
        var oldStaffId = appointment.StaffId;

        if (Enum.TryParse<AppointmentStatus>(status, ignoreCase: true, out var newStatus))
        {
            appointment.Status = newStatus;
        }

        if (staffId.HasValue)
        {
            appointment.StaffId = staffId.Value;
        }

        if (!string.IsNullOrEmpty(adminNotes))
        {
            appointment.AdminNotes = adminNotes;
        }

        _dbContext.Appointments.Update(appointment);
        await _dbContext.SaveChangesAsync();

        var notifications = new List<Backend.Models.Notification>();

        // If staff assignment changed, notify the new staff
        if (appointment.StaffId.HasValue && appointment.StaffId != oldStaffId)
        {
            var staff = await _dbContext.Staffs.FirstOrDefaultAsync(s => s.StaffId == appointment.StaffId);
            if (staff != null)
            {
                notifications.Add(new Backend.Models.Notification
                {
                    UserId = staff.UserId,
                    Type = NotificationType.Appointment,
                    Title = "New appointment assigned",
                    Message = $"You have been assigned to an appointment for {appointment.ServiceType} on {appointment.AppointmentDateTime:yyyy-MM-dd HH:mm}.",
                    IsRead = false,
                    CreatedAt = DateTime.UtcNow,
                    RelatedEntityType = "Appointment",
                    RelatedEntityId = appointment.AppointmentId
                });
            }
        }

        // If status changed to Approved, notify customer
        if (appointment.Status == AppointmentStatus.Approved && oldStatus != AppointmentStatus.Approved)
        {
            var customer = await _dbContext.Customers.Include(c => c.User).FirstOrDefaultAsync(c => c.CustomerId == appointment.CustomerId);
            if (customer?.User != null)
            {
                notifications.Add(new Backend.Models.Notification
                {
                    UserId = customer.User.UserId,
                    Type = NotificationType.Appointment,
                    Title = "Appointment approved",
                    Message = $"Your appointment for {appointment.ServiceType} on {appointment.AppointmentDateTime:yyyy-MM-dd HH:mm} has been approved.",
                    IsRead = false,
                    CreatedAt = DateTime.UtcNow,
                    RelatedEntityType = "Appointment",
                    RelatedEntityId = appointment.AppointmentId
                });
            }
        }

        // If appointment moved to Completed, notify the customer
        if (appointment.Status == AppointmentStatus.Completed && oldStatus != AppointmentStatus.Completed)
        {
            var customer = await _dbContext.Customers.Include(c => c.User).FirstOrDefaultAsync(c => c.CustomerId == appointment.CustomerId);
            if (customer?.User != null)
            {
                notifications.Add(new Backend.Models.Notification
                {
                    UserId = customer.User.UserId,
                    Type = NotificationType.Appointment,
                    Title = "Appointment completed",
                    Message = $"Your appointment for {appointment.ServiceType} on {appointment.AppointmentDateTime:yyyy-MM-dd HH:mm} has been marked completed.",
                    IsRead = false,
                    CreatedAt = DateTime.UtcNow,
                    RelatedEntityType = "Appointment",
                    RelatedEntityId = appointment.AppointmentId
                });
            }
        }

        if (notifications.Any())
        {
            _dbContext.Notifications.AddRange(notifications);
            await _dbContext.SaveChangesAsync();
        }

        return new AppointmentDto
        {
            AppointmentId = appointment.AppointmentId,
            CustomerId = appointment.CustomerId,
            VehicleId = appointment.VehicleId,
            AppointmentDateTime = appointment.AppointmentDateTime,
            ServiceType = appointment.ServiceType,
            Description = appointment.Description,
            Status = appointment.Status.ToString(),
            AdminNotes = appointment.AdminNotes,
            StaffId = appointment.StaffId,
            CreatedAt = appointment.CreatedAt
        };
    }
}
