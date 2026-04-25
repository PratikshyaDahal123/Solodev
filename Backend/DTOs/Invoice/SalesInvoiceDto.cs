using System.ComponentModel.DataAnnotations;

namespace Backend.DTOs.Invoice;

public class SalesInvoiceDto
{
    public int SalesInvoiceId { get; set; }
    public string InvoiceNumber { get; set; } = string.Empty;
    public int CustomerId { get; set; }
    public int? VehicleId { get; set; }
    public int? StaffId { get; set; }
    public DateTime InvoiceDate { get; set; }
    public decimal Subtotal { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal AmountPaid { get; set; }
    public decimal BalanceAmount { get; set; }
    public string Status { get; set; } = string.Empty;
    public bool IsCreditSale { get; set; }
    public string? Notes { get; set; }
    // Included for UI convenience
    public string? CustomerName { get; set; }
    public string? CustomerEmail { get; set; }
    public IReadOnlyList<SalesInvoiceItemDto> Items { get; set; } = [];
}

public class CreateSalesInvoiceDto
{
    [Required]
    public int CustomerId { get; set; }

    public int? VehicleId { get; set; }

    public int? StaffId { get; set; }

    public decimal AmountPaid { get; set; }

    public string? Notes { get; set; }

    [Required]
    [MinLength(1)]
    public List<CreateSalesInvoiceItemDto> Items { get; set; } = [];
}

public class CreateSalesInvoiceItemDto
{
    [Required]
    public int PartId { get; set; }

    [Range(1, int.MaxValue)]
    public int Quantity { get; set; }

    [Range(0.01, double.MaxValue)]
    public decimal UnitPrice { get; set; }

    [Range(0, double.MaxValue)]
    public decimal Discount { get; set; }
}

public class SalesInvoiceItemDto
{
    public int SalesInvoiceItemId { get; set; }
    public int PartId { get; set; }
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal Discount { get; set; }
    public decimal LineTotal { get; set; }
}
