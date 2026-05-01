using Backend.Data;
using Backend.DTOs.Category;
using Backend.Models;
using Backend.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services;

public class CategoryService : ICategoryService
{
    private readonly AppDbContext _dbContext;

    public CategoryService(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<IReadOnlyList<CategoryDto>> GetAllAsync()
    {
        var categories = await _dbContext.Categories.ToListAsync();
        return categories.Select(MapToDto).ToList();
    }

    public async Task<CategoryDto?> GetByIdAsync(int categoryId)
    {
        var category = await _dbContext.Categories.FirstOrDefaultAsync(x => x.CategoryId == categoryId);
        return category is null ? null : MapToDto(category);
    }

    public async Task<CategoryDto> CreateAsync(CreateCategoryDto request)
    {
        var category = new Category
        {
            CategoryName = request.CategoryName,
            Description = request.Description,
            IsActive = request.IsActive
        };

        _dbContext.Categories.Add(category);
        await _dbContext.SaveChangesAsync();

        return MapToDto(category);
    }

    public async Task<CategoryDto?> UpdateAsync(int categoryId, UpdateCategoryDto request)
    {
        var category = await _dbContext.Categories.FirstOrDefaultAsync(x => x.CategoryId == categoryId);
        if (category is null)
        {
            return null;
        }

        category.CategoryName = request.CategoryName;
        category.Description = request.Description;
        category.IsActive = request.IsActive;

        await _dbContext.SaveChangesAsync();

        return MapToDto(category);
    }

    public async Task<bool> DeleteAsync(int categoryId)
    {
        var category = await _dbContext.Categories.FirstOrDefaultAsync(x => x.CategoryId == categoryId);
        if (category is null)
        {
            return false;
        }

        _dbContext.Categories.Remove(category);
        await _dbContext.SaveChangesAsync();

        return true;
    }

    private static CategoryDto MapToDto(Category category)
    {
        return new CategoryDto
        {
            CategoryId = category.CategoryId,
            CategoryName = category.CategoryName,
            Description = category.Description,
            IsActive = category.IsActive
        };
    }
}
