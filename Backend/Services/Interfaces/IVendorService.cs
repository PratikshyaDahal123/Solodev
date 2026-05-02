using Backend.DTOs.Vendor;

namespace Backend.Services.Interfaces;

public interface IVendorService
{
    Task<IReadOnlyList<VendorDto>> GetAllAsync();
    Task<VendorDto?> GetByIdAsync(int vendorId);
    Task<VendorDto> CreateAsync(CreateVendorDto request);
    Task<VendorDto?> UpdateAsync(int vendorId, UpdateVendorDto request);
    Task<bool> DeleteAsync(int vendorId);
}
