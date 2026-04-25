using System.ComponentModel.DataAnnotations;

namespace Backend.DTOs.Customer;

public class CreateReviewDto
{
    public int? AppointmentId { get; set; }

    [Range(1, 5)]
    public int Rating { get; set; }

    [MaxLength(1000)]
    public string? Comment { get; set; }
}

public class ReviewDto
{
    public int ReviewId { get; set; }
    public int CustomerId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public int? AppointmentId { get; set; }
    public DateTime? AppointmentDateTime { get; set; }
    public string? ServiceType { get; set; }
    public string? AppointmentStatus { get; set; }
    public int? StaffId { get; set; }
    public string? StaffName { get; set; }
    public int Rating { get; set; }
    public string? Comment { get; set; }
    public DateTime CreatedAt { get; set; }
    public bool IsApproved { get; set; }
}
