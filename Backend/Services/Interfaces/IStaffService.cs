using Backend.DTOs.Staff;

namespace Backend.Services.Interfaces;

public interface IStaffService
{
    Task<StaffDto> RegisterAsync(CreateStaffDto request);
    Task<StaffDto?> UpdateRoleAsync(int staffId, UpdateStaffRoleDto request);
    Task<StaffDto?> UpdateAsync(int staffId, UpdateStaffDto request);
    Task<bool> DeleteAsync(int staffId);
    Task<IReadOnlyList<StaffDto>> GetAllAsync();
}
