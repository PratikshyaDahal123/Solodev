using System.ComponentModel.DataAnnotations;

namespace Backend.Models;

public class Vehicle
{
    public int VehicleId { get; set; }

    public int CustomerId { get; set; }

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

    [MaxLength(100)]
    public string? EngineNumber { get; set; }

    [MaxLength(100)]
    public string? ChassisNumber { get; set; }

    [MaxLength(500)]
    public string? Notes { get; set; }

    public Customer Customer { get; set; } = null!;

    public ICollection<Appointment> Appointments { get; set; } = new List<Appointment>();

    public ICollection<SalesInvoice> SalesInvoices { get; set; } = new List<SalesInvoice>();
}
