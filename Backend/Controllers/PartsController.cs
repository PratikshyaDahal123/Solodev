using Backend.DTOs.Parts;
using Backend.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PartsController : ControllerBase
{
    private readonly IPartService _partService;

    public PartsController(IPartService partService)
    {
        _partService = partService;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<IReadOnlyList<PartDto>>> GetAll()
    {
        var items = await _partService.GetAllAsync();
        return Ok(items);
    }

    [HttpGet("{partId:int}")]
    [AllowAnonymous]
    public async Task<ActionResult<PartDto>> GetById([FromRoute] int partId)
    {
        var item = await _partService.GetByIdAsync(partId);
        if (item is null)
        {
            return NotFound();
        }

        return Ok(item);
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<PartDto>> Create([FromBody] CreatePartDto request)
    {
        try
        {
            var created = await _partService.CreateAsync(request);
            return CreatedAtAction(nameof(GetById), new { partId = created.PartId }, created);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("{partId:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<PartDto>> Update([FromRoute] int partId, [FromBody] UpdatePartDto request)
    {
        try
        {
            var updated = await _partService.UpdateAsync(partId, request);
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

    [HttpDelete("{partId:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete([FromRoute] int partId)
    {
        var deleted = await _partService.DeleteAsync(partId);
        if (!deleted)
        {
            return NotFound();
        }

        return NoContent();
    }
}
