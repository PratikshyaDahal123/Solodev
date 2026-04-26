using System.ComponentModel.DataAnnotations;

namespace Backend.DTOs.Parts;

public class UpdatePartDto
{
    [Required]
    [MaxLength(150)]
    public string PartName { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Description { get; set; }

    [Range(0.01, double.MaxValue)]
    public decimal CostPrice { get; set; }

    [Range(0.01, double.MaxValue)]
    public decimal UnitPrice { get; set; }

    [Range(1, int.MaxValue)]
    public int ReorderLevel { get; set; } = 10;
    public int? CategoryId { get; set; }

    public bool IsActive { get; set; } = true;
}
