using System.ComponentModel.DataAnnotations;

namespace Backend.Models;

public class Review
{
    public int ReviewId { get; set; }

    public int CustomerId { get; set; }

    public int? AppointmentId { get; set; }

    [Range(1, 5)]
    public int Rating { get; set; }

    [MaxLength(1000)]
    public string? Comment { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public bool IsApproved { get; set; }

    public Customer Customer { get; set; } = null!;

    public Appointment? Appointment { get; set; }
}
