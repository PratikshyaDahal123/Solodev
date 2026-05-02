using Backend.DTOs.Customer;

namespace Backend.Services.Interfaces;

public interface ICustomerService
{
    Task<CustomerDto> RegisterAsync(CreateCustomerDto request);
    Task<IReadOnlyList<CustomerDto>> SearchAsync(string term);
    Task<CustomerDto?> GetByIdAsync(int customerId);
    Task<ReviewDto> CreateReviewAsync(int customerId, CreateReviewDto request);
    Task<IReadOnlyList<ReviewDto>> GetReviewsForStaffAsync(int staffId);
    Task<IReadOnlyList<ReviewDto>> GetAllReviewsAsync();
    Task<CustomerHistoryDto?> GetHistoryAsync(int customerId);
    Task<CustomerDto?> UpdateProfileAsync(int customerId, UpdateCustomerProfileDto request);
    Task<bool> DeleteAsync(int customerId);
    Task<CustomerDto?> AddVehicleAsync(int customerId, CreateVehicleDto request);
    Task<CustomerDto?> UpdateVehicleAsync(int customerId, int vehicleId, UpdateVehicleDto request);
    Task<CustomerDto?> DeleteVehicleAsync(int customerId, int vehicleId);
    Task<PartRequestDto> CreatePartRequestAsync(int customerId, CreatePartRequestDto request);
    Task<IReadOnlyList<PartRequestDto>> GetPartRequestsAsync(int customerId);
}
