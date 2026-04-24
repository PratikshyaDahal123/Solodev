using Backend.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Customer,Admin")]
public class AiController : ControllerBase
{
    private readonly IAiService _aiService;

    public AiController(IAiService aiService)
    {
        _aiService = aiService;
    }

    [HttpPost("analyze")]
    public async Task<IActionResult> AnalyzeVehicle([FromQuery] int customerId)
    {
        if (customerId <= 0) return BadRequest("Invalid customer ID.");
        
        var resultMessage = await _aiService.AnalyzeVehicleHealthAsync(customerId);
        return Ok(new { message = resultMessage });
    }
}
