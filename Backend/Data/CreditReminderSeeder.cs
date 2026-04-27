using Backend.Services.Interfaces;

namespace Backend.Data;

public static class CreditReminderSeeder
{
    public static async Task SeedAsync(IServiceProvider services, IConfiguration configuration)
    {
        using var scope = services.CreateScope();
        var notificationService = scope.ServiceProvider.GetRequiredService<INotificationService>();

        var overdueDays = int.TryParse(configuration["Notifications:OverdueDays"], out var od) ? od : 30;
        await notificationService.CreateOverdueCreditNotificationsAsync(overdueDays);
    }
}
