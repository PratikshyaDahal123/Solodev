using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Models;

public class PurchaseInvoiceItem
{
    public int PurchaseInvoiceItemId { get; set; }

    public int PurchaseInvoiceId { get; set; }

    public int PartId { get; set; }

    [Range(1, int.MaxValue)]
    public int Quantity { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal UnitCost { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal LineTotal { get; set; }

    public PurchaseInvoice PurchaseInvoice { get; set; } = null!;

    public Part Part { get; set; } = null!;
}
