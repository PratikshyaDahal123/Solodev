using Backend.Services.Interfaces;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;

namespace Backend.Services;

public class OverdueReminderHostedService : BackgroundService
{
    private readonly IServiceProvider _services;
    private readonly ILogger<OverdueReminderHostedService> _logger;
    private readonly IConfiguration _configuration;

    public OverdueReminderHostedService(IServiceProvider services, ILogger<OverdueReminderHostedService> logger, IConfiguration configuration)
    {
        _services = services;
        _logger = logger;
        _configuration = configuration;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("OverdueReminderHostedService started.");

        // Read config values; defaults: 30 days overdue, run once per day
        var overdueDays = int.TryParse(_configuration["Notifications:OverdueDays"], out var od) ? od : 30;
        var intervalHours = double.TryParse(_configuration["Notifications:OverdueIntervalHours"], out var ih) ? ih : 24.0;

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _services.CreateScope();
                var notificationService = scope.ServiceProvider.GetRequiredService<INotificationService>();

                var count = await notificationService.SendOverdueCreditRemindersAsync(overdueDays);
                _logger.LogInformation("Sent {Count} overdue reminder emails for invoices older than {Days} days.", count, overdueDays);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error while sending overdue reminders.");
            }

            try
            {
                await Task.Delay(TimeSpan.FromHours(intervalHours), stoppingToken);
            }
            catch (TaskCanceledException) { }
        }

        _logger.LogInformation("OverdueReminderHostedService stopping.");
    }
}
