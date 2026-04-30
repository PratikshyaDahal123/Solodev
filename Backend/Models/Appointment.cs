using System.ComponentModel.DataAnnotations;
using Backend.Enums;

namespace Backend.Models;

public class Appointment
{
    public int AppointmentId { get; set; }

    public int CustomerId { get; set; }

    public int? VehicleId { get; set; }

    public int? StaffId { get; set; }

    public DateTime AppointmentDateTime { get; set;}

    [Required]
    [MaxLength(100)]
    public string ServiceType { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Description { get; set; }

    public AppointmentStatus Status { get; set; }

    [MaxLength(500)]
    public string? AdminNotes { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Customer Customer { get; set; } = null!;

    public Vehicle? Vehicle { get; set; }

    public Staff? Staff { get; set; }

    public Review? Review { get; set; }
}
