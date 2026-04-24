using Backend.DTOs.Staff;
using Backend.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class StaffController : ControllerBase
{
    private readonly IStaffService _staffService;

    public StaffController(IStaffService staffService)
    {
        _staffService = staffService;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<StaffDto>>> GetAll()
    {
        var items = await _staffService.GetAllAsync();
        return Ok(items);
    }

    [HttpPost("register")]
    public async Task<ActionResult<StaffDto>> Register([FromBody] CreateStaffDto request)
    {
        try
        {
            var created = await _staffService.RegisterAsync(request);
            return Ok(created);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("{staffId:int}/role")]
    public async Task<ActionResult<StaffDto>> UpdateRole([FromRoute] int staffId, [FromBody] UpdateStaffRoleDto request)
    {
        var updated = await _staffService.UpdateRoleAsync(staffId, request);
        if (updated is null)
        {
            return NotFound();
        }

        return Ok(updated);
    }

    [HttpPut("{staffId:int}")]
    public async Task<ActionResult<StaffDto>> Update([FromRoute] int staffId, [FromBody] UpdateStaffDto request)
    {
        try
        {
            var updated = await _staffService.UpdateAsync(staffId, request);
            if (updated is null)
            {
                return NotFound();
            }

            return Ok(updated);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpDelete("{staffId:int}")]
    public async Task<IActionResult> Delete([FromRoute] int staffId)
    {
        var deleted = await _staffService.DeleteAsync(staffId);
        if (!deleted)
        {
            return NotFound();
        }

        return NoContent();
    }
}
