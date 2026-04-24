using Backend.DTOs.Appointment;
using Backend.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AppointmentController : ControllerBase
{
    private readonly IAppointmentService _appointmentService;

    public AppointmentController(IAppointmentService appointmentService)
    {
        _appointmentService = appointmentService;
    }

    [HttpPost]
    [Authorize(Roles = "Customer,Staff,Admin")]
    public async Task<ActionResult<AppointmentDto>> Book([FromBody] CreateAppointmentDto request)
    {
        try
        {
            var result = await _appointmentService.BookAsync(request);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("customer/{customerId:int}")]
    [Authorize(Roles = "Customer,Staff,Admin")]
    public async Task<ActionResult<IReadOnlyList<AppointmentDto>>> GetByCustomer([FromRoute] int customerId)
    {
        var items = await _appointmentService.GetByCustomerAsync(customerId);
        return Ok(items);
    }

    [HttpGet]
    [Authorize(Roles = "Staff,Admin")]
    public async Task<ActionResult<IReadOnlyList<AppointmentDto>>> GetAll()
    {
        var items = await _appointmentService.GetAllAsync();
        return Ok(items);
    }

    [HttpPut("{appointmentId:int}/status")]
    [Authorize(Roles = "Staff,Admin")]
    public async Task<ActionResult<AppointmentDto>> UpdateStatus([FromRoute] int appointmentId, [FromBody] UpdateAppointmentStatusDto request)
    {
        try
        {
            var result = await _appointmentService.UpdateStatusAsync(appointmentId, request.Status, request.StaffId, request.AdminNotes);
            if (result is null)
                return NotFound();
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
