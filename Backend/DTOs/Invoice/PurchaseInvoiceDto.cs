using System.ComponentModel.DataAnnotations;

namespace Backend.DTOs.Invoice;

public class PurchaseInvoiceDto
{
    public int PurchaseInvoiceId { get; set; }
    public string InvoiceNumber { get; set; } = string.Empty;
    public int VendorId { get; set; }
    public int? StaffId { get; set; }
    public DateTime InvoiceDate { get; set; }
    public decimal Subtotal { get; set; }
    public decimal TaxAmount { get; set; }
    public decimal TotalAmount { get; set; }
    public string? Notes { get; set; }
    public IReadOnlyList<PurchaseInvoiceItemDto> Items { get; set; } = [];
}

public class CreatePurchaseInvoiceDto
{
    [Required]
    public int VendorId { get; set; }

    public int? StaffId { get; set; }

    [Range(0, double.MaxValue)]
    public decimal TaxAmount { get; set; }

    public string? Notes { get; set; }

    [Required]
    [MinLength(1)]
    public List<CreatePurchaseInvoiceItemDto> Items { get; set; } = [];
}

public class UpdatePurchaseInvoiceDto
{
    [Required]
    public int VendorId { get; set; }

    public int? StaffId { get; set; }

    [Range(0, double.MaxValue)]
    public decimal TaxAmount { get; set; }

    public string? Notes { get; set; }

    [Required]
    [MinLength(1)]
    public List<UpdatePurchaseInvoiceItemDto> Items { get; set; } = [];
}

public class CreatePurchaseInvoiceItemDto
{
    [Required]
    public int PartId { get; set; }

    [Range(1, int.MaxValue)]
    public int Quantity { get; set; }

    [Range(0.01, double.MaxValue)]
    public decimal UnitCost { get; set; }
}

public class UpdatePurchaseInvoiceItemDto
{
    [Required]
    public int PartId { get; set; }

    [Range(1, int.MaxValue)]
    public int Quantity { get; set; }

    [Range(0.01, double.MaxValue)]
    public decimal UnitCost { get; set; }
}

public class PurchaseInvoiceItemDto
{
    public int PurchaseInvoiceItemId { get; set; }
    public int PartId { get; set; }
    public int Quantity { get; set; }
    public decimal UnitCost { get; set; }
    public decimal LineTotal { get; set; }
}
