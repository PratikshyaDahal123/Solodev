using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Backend.Enums;

namespace Backend.Models;

public class SalesInvoice
{
    public int SalesInvoiceId { get; set; }

    [Required]
    [MaxLength(50)]
    public string InvoiceNumber { get; set; } = string.Empty;

    public int CustomerId { get; set; }

    public int? VehicleId { get; set; }

    public int? StaffId { get; set; }

    public DateTime InvoiceDate { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal Subtotal { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal DiscountAmount { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal TotalAmount { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal AmountPaid { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal BalanceAmount { get; set; }

    public InvoiceStatus Status { get; set; }

    public bool IsCreditSale { get; set; }

    [MaxLength(500)]
    public string? Notes { get; set; }

    public Customer Customer { get; set; } = null!;

    public Vehicle? Vehicle { get; set; }

    public Staff? Staff { get; set; }

    public ICollection<SalesInvoiceItem> Items { get; set; } = new List<SalesInvoiceItem>();
}
