using System.ComponentModel.DataAnnotations;

namespace Backend.DTOs.Customer;

public class CreateVehicleDto
{
    [Required]
    [MaxLength(20)]
    public string RegistrationNumber { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string Brand { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string Model { get; set; } = string.Empty;

    [Range(1900, 3000)]
    public int Year { get; set; }

    [MaxLength(50)]
    public string? Color { get; set; }

    [MaxLength(50)]
    public string? FuelType { get; set; }
}
