using Backend.DTOs.Parts;

namespace Backend.Services.Interfaces;

public interface IPartService
{
    Task<IReadOnlyList<PartDto>> GetAllAsync();
    Task<PartDto?> GetByIdAsync(int partId);
    Task<PartDto> CreateAsync(CreatePartDto request);
    Task<PartDto?> UpdateAsync(int partId, UpdatePartDto request);
    Task<bool> DeleteAsync(int partId);
}
