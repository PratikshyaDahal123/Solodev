using System.ComponentModel.DataAnnotations;

namespace Backend.DTOs.Customer;

public class CreatePartRequestDto
{
    [Required]
    [MaxLength(150)]
    public string PartName { get; set; } = string.Empty;

    [Range(1, int.MaxValue)]
    public int RequestedQuantity { get; set; }

    [MaxLength(500)]
    public string? Notes { get; set; }
}

public class PartRequestDto
{
    public int PartRequestId { get; set; }
    public int CustomerId { get; set; }
    public string PartName { get; set; } = string.Empty;
    public int RequestedQuantity { get; set; }
    public string? Notes { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime RequestedAt { get; set; }
}
