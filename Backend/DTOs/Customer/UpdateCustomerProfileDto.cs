using System.ComponentModel.DataAnnotations;

namespace Backend.DTOs.Customer;

public class UpdateCustomerProfileDto
{
    [MaxLength(150)]
    public string? FullName { get; set; }

    [EmailAddress]
    [MaxLength(150)]
    public string? Email { get; set; }

    [Phone]
    [MaxLength(20)]
    public string? PhoneNumber { get; set; }

    [MaxLength(250)]
    public string? Address { get; set; }
}
