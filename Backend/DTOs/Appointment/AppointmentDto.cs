namespace Backend.DTOs.Appointment;

public class AppointmentDto
{
    public int AppointmentId { get; set; }
    public int CustomerId { get; set; }
    public int? VehicleId { get; set; }
    public DateTime AppointmentDateTime { get; set; }
    public string ServiceType { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? AdminNotes { get; set; }
    public int? StaffId { get; set; }
    public DateTime CreatedAt { get; set; }
}
