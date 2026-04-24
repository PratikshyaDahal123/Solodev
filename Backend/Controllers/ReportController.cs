using Backend.DTOs.Report;
using Backend.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ReportController : ControllerBase
{
    private readonly IReportService _reportService;

    public ReportController(IReportService reportService)
    {
        _reportService = reportService;
    }

    [HttpGet("financial")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<FinancialReportDto>> GetFinancial([FromQuery] string period = "monthly", [FromQuery] DateTime? date = null)
    {
        try
        {
            var report = await _reportService.GetFinancialReportAsync(period, date);
            return Ok(report);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("customers/regular")]
    [Authorize(Roles = "Staff,Admin")]
    public async Task<ActionResult<IReadOnlyList<CustomerReportDto>>> GetRegularCustomers([FromQuery] int minPurchases = 3)
    {
        var data = await _reportService.GetRegularCustomersAsync(minPurchases);
        return Ok(data);
    }

    [HttpGet("customers/high-spenders")]
    [Authorize(Roles = "Staff,Admin")]
    public async Task<ActionResult<IReadOnlyList<CustomerReportDto>>> GetHighSpenders([FromQuery] decimal minSpent = 5000)
    {
        var data = await _reportService.GetHighSpendersAsync(minSpent);
        return Ok(data);
    }

    [HttpGet("customers/pending-credits")]
    [Authorize(Roles = "Staff,Admin")]
    public async Task<ActionResult<IReadOnlyList<CustomerReportDto>>> GetPendingCredits([FromQuery] int overdueDays = 30)
    {
        var data = await _reportService.GetPendingCreditsAsync(overdueDays);
        return Ok(data);
    }
}
