using System.ComponentModel.DataAnnotations;

namespace Backend.DTOs.Customer;

public class CreateCustomerDto
{
    [Required]
    [MaxLength(150)]
    public string FullName { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    [MaxLength(150)]
    public string Email { get; set; } = string.Empty;

    [Required]
    [Phone]
    [MaxLength(20)]
    public string PhoneNumber { get; set; } = string.Empty;

    [Required]
    [MinLength(6)]
    public string Password { get; set; } = string.Empty;

    [MaxLength(250)]
    public string? Address { get; set; }

    public CreateCustomerVehicleDto? Vehicle { get; set; }
}

public class CreateCustomerVehicleDto
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
