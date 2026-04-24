using Backend.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class AdminController : ControllerBase
{
    private readonly INotificationService _notificationService;

    public AdminController(INotificationService notificationService)
    {
        _notificationService = notificationService;
    }

    [HttpPost("notifications/low-stock")]
    public async Task<IActionResult> TriggerLowStockNotifications()
    {
        var count = await _notificationService.NotifyLowStockAsync();
        return Ok(new { notificationsCreated = count });
    }

    [HttpPost("notifications/overdue-reminders")]
    public async Task<IActionResult> TriggerOverdueReminders([FromQuery] int overdueDays = 30)
    {
        var count = await _notificationService.SendOverdueCreditRemindersAsync(overdueDays);
        return Ok(new { remindersSent = count });
    }
}
