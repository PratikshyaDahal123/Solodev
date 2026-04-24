using Backend.DTOs.Customer;
using Backend.Services.Interfaces;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CustomerController : ControllerBase
{
    private readonly ICustomerService _customerService;

    public CustomerController(ICustomerService customerService)
    {
        _customerService = customerService;
    }

    [HttpPost("register")]
    [Authorize(Roles = "Staff,Admin")]
    public async Task<ActionResult<CustomerDto>> Register([FromBody] CreateCustomerDto request)
    {
        try
        {
            var customer = await _customerService.RegisterAsync(request);
            return CreatedAtAction(nameof(GetById), new { customerId = customer.CustomerId }, customer);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("{customerId:int}")]
    [Authorize(Roles = "Customer,Staff,Admin")]
    public async Task<ActionResult<CustomerDto>> GetById([FromRoute] int customerId)
    {
        if (!await CanAccessCustomerAsync(customerId))
        {
            return Forbid();
        }

        var customer = await _customerService.GetByIdAsync(customerId);
        if (customer is null)
        {
            return NotFound();
        }

        return Ok(customer);
    }

    [HttpGet("search")]
    [Authorize(Roles = "Staff,Admin")]
    public async Task<ActionResult<IReadOnlyList<CustomerDto>>> Search([FromQuery] string term = "")
    {
        var customers = await _customerService.SearchAsync(term);
        return Ok(customers);
    }

    [HttpPost("{customerId:int}/reviews")]
    [Authorize(Roles = "Customer,Staff,Admin")]
    public async Task<ActionResult<ReviewDto>> CreateReview([FromRoute] int customerId, [FromBody] CreateReviewDto request)
    {
        if (!await CanAccessCustomerAsync(customerId))
        {
            return Forbid();
        }

        try
        {
            var result = await _customerService.CreateReviewAsync(customerId, request);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("reviews/staff/{staffId:int}")]
    [Authorize(Roles = "Staff,Admin")]
    public async Task<ActionResult<IReadOnlyList<ReviewDto>>> GetReviewsForStaff([FromRoute] int staffId)
    {
        var result = await _customerService.GetReviewsForStaffAsync(staffId);
        return Ok(result);
    }

    [HttpGet("reviews/all")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<IReadOnlyList<ReviewDto>>> GetAllReviews()
    {
        var result = await _customerService.GetAllReviewsAsync();
        return Ok(result);
    }

    [HttpGet("{customerId:int}/history")]
    [Authorize(Roles = "Customer,Staff,Admin")]
    public async Task<ActionResult<CustomerHistoryDto>> GetHistory([FromRoute] int customerId)
    {
        if (!await CanAccessCustomerAsync(customerId))
        {
            return Forbid();
        }

        var result = await _customerService.GetHistoryAsync(customerId);
        if (result is null)
        {
            return NotFound();
        }

        return Ok(result);
    }

    [HttpPut("{customerId:int}/profile")]
    [Authorize(Roles = "Customer,Staff,Admin")]
    public async Task<ActionResult<CustomerDto>> UpdateProfile([FromRoute] int customerId, [FromBody] UpdateCustomerProfileDto request)
    {
        if (!await CanAccessCustomerAsync(customerId))
        {
            return Forbid();
        }

        try
        {
            var updated = await _customerService.UpdateProfileAsync(customerId, request);
            if (updated is null)
                return NotFound();

            return Ok(updated);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpDelete("{customerId:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete([FromRoute] int customerId)
    {
        var deleted = await _customerService.DeleteAsync(customerId);
        if (!deleted)
        {
            return NotFound();
        }

        return NoContent();
    }

    [HttpPost("{customerId:int}/vehicles")]
    [Authorize(Roles = "Customer,Staff,Admin")]
    public async Task<ActionResult<CustomerDto>> AddVehicle([FromRoute] int customerId, [FromBody] CreateVehicleDto request)
    {
        if (!await CanAccessCustomerAsync(customerId))
        {
            return Forbid();
        }

        try
        {
            var updated = await _customerService.AddVehicleAsync(customerId, request);
            if (updated is null)
                return NotFound();

            return Ok(updated);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("{customerId:int}/vehicles/{vehicleId:int}")]
    [Authorize(Roles = "Customer,Staff,Admin")]
    public async Task<ActionResult<CustomerDto>> UpdateVehicle([FromRoute] int customerId, [FromRoute] int vehicleId, [FromBody] UpdateVehicleDto request)
    {
        if (!await CanAccessCustomerAsync(customerId))
        {
            return Forbid();
        }

        var updated = await _customerService.UpdateVehicleAsync(customerId, vehicleId, request);
        if (updated is null)
            return NotFound();

        return Ok(updated);
    }

    [HttpPost("{customerId:int}/part-requests")]
    [Authorize(Roles = "Customer,Staff,Admin")]
    public async Task<ActionResult<PartRequestDto>> CreatePartRequest([FromRoute] int customerId, [FromBody] CreatePartRequestDto request)
    {
        if (!await CanAccessCustomerAsync(customerId))
        {
            return Forbid();
        }

        try
        {
            var result = await _customerService.CreatePartRequestAsync(customerId, request);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("{customerId:int}/part-requests")]
    [Authorize(Roles = "Customer,Staff,Admin")]
    public async Task<ActionResult<IReadOnlyList<PartRequestDto>>> GetPartRequests([FromRoute] int customerId)
    {
        if (!await CanAccessCustomerAsync(customerId))
        {
            return Forbid();
        }

        var result = await _customerService.GetPartRequestsAsync(customerId);
        return Ok(result);
    }

    [HttpDelete("{customerId:int}/vehicles/{vehicleId:int}")]
    [Authorize(Roles = "Customer,Staff,Admin")]
    public async Task<ActionResult<CustomerDto>> DeleteVehicle([FromRoute] int customerId, [FromRoute] int vehicleId)
    {
        if (!await CanAccessCustomerAsync(customerId))
        {
            return Forbid();
        }

        var updated = await _customerService.DeleteVehicleAsync(customerId, vehicleId);
        if (updated is null)
            return NotFound();

        return Ok(updated);
    }

    private async Task<bool> CanAccessCustomerAsync(int customerId)
    {
        if (!User.IsInRole("Customer"))
        {
            return true;
        }

        var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(userIdValue, out var userId))
        {
            return false;
        }

        var customer = await _customerService.GetByIdAsync(customerId);
        return customer is not null && customer.UserId == userId;
    }
}
