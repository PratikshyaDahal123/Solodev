using System.ComponentModel.DataAnnotations;

namespace Backend.DTOs.Appointment;

public class CreateAppointmentDto
{
    [Required]
    public int CustomerId { get; set; }

    public int? VehicleId { get; set; }

    [Required]
    public DateTime AppointmentDateTime { get; set; }

    [Required]
    [MaxLength(100)]
    public string ServiceType { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Description { get; set; }
}
