using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Models;

public class SalesInvoiceItem
{
    public int SalesInvoiceItemId { get; set; }

    public int SalesInvoiceId { get; set; }

    public int PartId { get; set; }

    [Range(1, int.MaxValue)]
    public int Quantity { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal UnitPrice { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal Discount { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal LineTotal { get; set; }

    public SalesInvoice SalesInvoice { get; set; } = null!;

    public Part Part { get; set; } = null!;
}
