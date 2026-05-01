using Backend.DTOs.Appointment;

namespace Backend.Services.Interfaces;

public interface IAppointmentService
{
    Task<AppointmentDto> BookAsync(CreateAppointmentDto request);
    Task<IReadOnlyList<AppointmentDto>> GetByCustomerAsync(int customerId);
    Task<IReadOnlyList<AppointmentDto>> GetAllAsync();
    Task<AppointmentDto?> UpdateStatusAsync(int appointmentId, string status, int? staffId = null, string? adminNotes = null);
}
