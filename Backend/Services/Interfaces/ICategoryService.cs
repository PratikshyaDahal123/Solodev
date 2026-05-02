using Backend.DTOs.Category;

namespace Backend.Services.Interfaces;

public interface ICategoryService
{
    Task<IReadOnlyList<CategoryDto>> GetAllAsync();
    Task<CategoryDto?> GetByIdAsync(int categoryId);
    Task<CategoryDto> CreateAsync(CreateCategoryDto request);
    Task<CategoryDto?> UpdateAsync(int categoryId, UpdateCategoryDto request);
    Task<bool> DeleteAsync(int categoryId);
}
