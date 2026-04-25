namespace Backend.DTOs.Appointment;

public class UpdateAppointmentStatusDto
{
    public string Status { get; set; } = string.Empty;
    public int? StaffId { get; set; }
    public string? AdminNotes { get; set; }
}
