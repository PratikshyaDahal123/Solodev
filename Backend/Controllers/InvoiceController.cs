using System.Security.Claims;
using Backend.Data;
using Backend.DTOs.Invoice;
using Backend.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class InvoiceController : ControllerBase
{
    private readonly IInvoiceService _invoiceService;
    private readonly AppDbContext _dbContext;

    public InvoiceController(IInvoiceService invoiceService, AppDbContext dbContext)
    {
        _invoiceService = invoiceService;
        _dbContext = dbContext;
    }

    [HttpGet("purchase")]
    public async Task<ActionResult<IReadOnlyList<PurchaseInvoiceDto>>> GetPurchaseInvoices()
    {
        var invoices = await _invoiceService.GetAllPurchaseInvoicesAsync();
        return Ok(invoices);
    }

    [HttpPost("purchase")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<PurchaseInvoiceDto>> CreatePurchaseInvoice([FromBody] CreatePurchaseInvoiceDto request)
    {
        try
        {
            var result = await _invoiceService.CreatePurchaseInvoiceAsync(request);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("purchase/{purchaseInvoiceId:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<PurchaseInvoiceDto>> UpdatePurchaseInvoice([FromRoute] int purchaseInvoiceId, [FromBody] UpdatePurchaseInvoiceDto request)
    {
        try
        {
            var result = await _invoiceService.UpdatePurchaseInvoiceAsync(purchaseInvoiceId, request);
            if (result is null)
            {
                return NotFound();
            }

            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpDelete("purchase/{purchaseInvoiceId:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeletePurchaseInvoice([FromRoute] int purchaseInvoiceId)
    {
        try
        {
            var deleted = await _invoiceService.DeletePurchaseInvoiceAsync(purchaseInvoiceId);
            if (!deleted)
            {
                return NotFound();
            }

            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("sales")]
    public async Task<ActionResult<IReadOnlyList<SalesInvoiceDto>>> GetSalesInvoices()
    {
        var invoices = await _invoiceService.GetAllSalesInvoicesAsync();
        return Ok(invoices);
    }

    [HttpPost("sales")]
    [Authorize(Roles = "Staff,Admin,Customer")]
    public async Task<ActionResult<SalesInvoiceDto>> CreateSalesInvoice([FromBody] CreateSalesInvoiceDto request)
    {
        try
        {
            if (User.IsInRole("Customer"))
            {
                var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (!int.TryParse(userIdValue, out var userId))
                {
                    return Forbid();
                }

                var customerId = await _dbContext.Customers
                    .AsNoTracking()
                    .Where(x => x.UserId == userId)
                    .Select(x => (int?)x.CustomerId)
                    .FirstOrDefaultAsync();

                if (!customerId.HasValue || customerId.Value != request.CustomerId)
                {
                    return Forbid();
                }

                request.StaffId = null;
            }

            var result = await _invoiceService.CreateSalesInvoiceAsync(request);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("sales/{salesInvoiceId:int}/send-email")]
    [Authorize(Roles = "Staff,Admin")]
    public async Task<IActionResult> SendSalesInvoiceEmail([FromRoute] int salesInvoiceId, [FromBody] SendInvoiceEmailDto request)
    {
        var sent = await _invoiceService.SendSalesInvoiceEmailAsync(salesInvoiceId, request.Email);
        if (!sent)
        {
            return BadRequest(new { message = "Email could not be sent. Check SMTP settings and Gmail app-password credentials." });
        }

        return Ok(new { message = "Invoice email sent." });
    }
}
