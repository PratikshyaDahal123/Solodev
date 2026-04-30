using System.ComponentModel.DataAnnotations;
using Backend.Enums;

namespace Backend.Models;

public class PartRequest
{
    public int PartRequestId { get; set; }

    public int CustomerId { get; set; }

    [Required]
    [MaxLength(150)]
    public string PartName { get; set; } = string.Empty;

    [Range(1, int.MaxValue)]
    public int RequestedQuantity { get; set; }

    [MaxLength(500)]
    public string? Notes { get; set; }

    public PartRequestStatus Status { get; set; }

    public DateTime RequestedAt { get; set; } = DateTime.UtcNow;

    public Customer Customer { get; set; } = null!;
}
