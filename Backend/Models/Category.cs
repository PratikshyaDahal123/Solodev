using System.ComponentModel.DataAnnotations;

namespace Backend.Models;

public class Category
{
    public int CategoryId { get; set; }

    [Required]
    [MaxLength(100)]
    public string CategoryName { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Description { get; set; }

    public bool IsActive { get; set; } = true;

    // A category can have many parts
    public ICollection<Part> Parts { get; set; } = new List<Part>();
}
