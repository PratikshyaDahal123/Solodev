using Backend.Services.Interfaces;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;

namespace Backend.Services;

public class LowStockHostedService : BackgroundService
{
    private readonly IServiceProvider _services;
    private readonly ILogger<LowStockHostedService> _logger;
    private readonly IConfiguration _configuration;

    public LowStockHostedService(IServiceProvider services, ILogger<LowStockHostedService> logger, IConfiguration configuration)
    {
        _services = services;
        _logger = logger;
        _configuration = configuration;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("LowStockHostedService started.");

        var threshold = int.TryParse(_configuration["Notifications:LowStockThreshold"], out var t) ? t : 10;
        var intervalHours = double.TryParse(_configuration["Notifications:LowStockIntervalHours"], out var ih) ? ih : 1.0;

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _services.CreateScope();
                var notificationService = scope.ServiceProvider.GetRequiredService<INotificationService>();

                var count = await notificationService.NotifyLowStockByThresholdAsync(threshold, intervalHours);
                _logger.LogInformation("Low stock notifications created: {Count} (threshold={Threshold}).", count, threshold);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error while sending low-stock notifications.");
            }

            try
            {
                await Task.Delay(TimeSpan.FromHours(intervalHours), stoppingToken);
            }
            catch (TaskCanceledException) { }
        }

        _logger.LogInformation("LowStockHostedService stopping.");
    }
}
