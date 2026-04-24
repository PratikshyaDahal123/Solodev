using Backend.DTOs.Category;
using Backend.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class CategoryController : ControllerBase
{
    private readonly ICategoryService _categoryService;

    public CategoryController(ICategoryService categoryService)
    {
        _categoryService = categoryService;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<IReadOnlyList<CategoryDto>>> GetAll()
    {
        var items = await _categoryService.GetAllAsync();
        return Ok(items);
    }

    [HttpGet("{categoryId:int}")]
    [AllowAnonymous]
    public async Task<ActionResult<CategoryDto>> GetById([FromRoute] int categoryId)
    {
        var item = await _categoryService.GetByIdAsync(categoryId);
        if (item is null)
        {
            return NotFound();
        }
        return Ok(item);
    }

    [HttpPost]
    public async Task<ActionResult<CategoryDto>> Create([FromBody] CreateCategoryDto request)
    {
        var created = await _categoryService.CreateAsync(request);
        return CreatedAtAction(nameof(GetById), new { categoryId = created.CategoryId }, created);
    }

    [HttpPut("{categoryId:int}")]
    public async Task<ActionResult<CategoryDto>> Update([FromRoute] int categoryId, [FromBody] UpdateCategoryDto request)
    {
        var updated = await _categoryService.UpdateAsync(categoryId, request);
        if (updated is null)
        {
            return NotFound();
        }
        return Ok(updated);
    }

    [HttpDelete("{categoryId:int}")]
    public async Task<IActionResult> Delete([FromRoute] int categoryId)
    {
        var deleted = await _categoryService.DeleteAsync(categoryId);
        if (!deleted)
        {
            return NotFound();
        }
        return NoContent();
    }
}
