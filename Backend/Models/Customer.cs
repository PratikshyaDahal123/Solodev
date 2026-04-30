using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Models;

public class Customer
{
    public int CustomerId { get; set; }

    public int UserId { get; set; }

    [Required]
    [MaxLength(50)]
    public string CustomerCode { get; set; } = string.Empty;

    [MaxLength(250)]
    public string? Address { get; set; }

    public DateTime DateJoined { get; set; } = DateTime.UtcNow;

    [Column(TypeName = "decimal(18,2)")]
    public decimal CreditBalance { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal TotalSpent { get; set; }

    public int LoyaltyPoints { get; set; }

    public User User { get; set; } = null!;

    public ICollection<Vehicle> Vehicles { get; set; } = new List<Vehicle>();

    public ICollection<SalesInvoice> SalesInvoices { get; set; } = new List<SalesInvoice>();

    public ICollection<Appointment> Appointments { get; set; } = new List<Appointment>();

    public ICollection<Review> Reviews { get; set; } = new List<Review>();
}
