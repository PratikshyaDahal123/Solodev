using Backend.DTOs.Vendor;
using Backend.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class VendorController : ControllerBase
{
    private readonly IVendorService _vendorService;

    public VendorController(IVendorService vendorService)
    {
        _vendorService = vendorService;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<VendorDto>>> GetAll()
    {
        var vendors = await _vendorService.GetAllAsync();
        return Ok(vendors);
    }

    [HttpGet("{vendorId:int}")]
    public async Task<ActionResult<VendorDto>> GetById([FromRoute] int vendorId)
    {
        var vendor = await _vendorService.GetByIdAsync(vendorId);
        if (vendor is null)
        {
            return NotFound();
        }

        return Ok(vendor);
    }

    [HttpPost]
    public async Task<ActionResult<VendorDto>> Create([FromBody] CreateVendorDto request)
    {
        var created = await _vendorService.CreateAsync(request);
        return CreatedAtAction(nameof(GetById), new { vendorId = created.VendorId }, created);
    }

    [HttpPut("{vendorId:int}")]
    public async Task<ActionResult<VendorDto>> Update([FromRoute] int vendorId, [FromBody] UpdateVendorDto request)
    {
        var updated = await _vendorService.UpdateAsync(vendorId, request);
        if (updated is null)
        {
            return NotFound();
        }

        return Ok(updated);
    }

    [HttpDelete("{vendorId:int}")]
    public async Task<IActionResult> Delete([FromRoute] int vendorId)
    {
        var deleted = await _vendorService.DeleteAsync(vendorId);
        if (!deleted)
        {
            return NotFound();
        }

        return NoContent();
    }
}
