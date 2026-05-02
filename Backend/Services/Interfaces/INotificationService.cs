using Backend.DTOs;

namespace Backend.Services.Interfaces;

public interface INotificationService
{
    Task<int> NotifyLowStockAsync();
    Task<int> NotifyLowStockByThresholdAsync(int threshold = 10, double repeatHours = 1);
    Task<int> NotifyPartLowStockAsync(int partId, int currentQuantity, int threshold = 10);
    Task<int> CreateOverdueCreditNotificationsAsync(int overdueDays = 30);
    Task<int> SendOverdueCreditRemindersAsync(int overdueDays = 30);
    Task<IEnumerable<NotificationDto>> GetUserNotificationsAsync(int userId, bool? isRead = null);
    Task<bool> MarkAsReadAsync(int notificationId, int userId);
    Task<bool> MarkAllAsReadAsync(int userId);
    Task<bool> DeleteNotificationAsync(int notificationId, int userId);
}
