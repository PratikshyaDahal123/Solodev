namespace Backend.DTOs.Report;

public class FinancialReportDto
{
    public string Period { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public decimal TotalSales { get; set; }
    public decimal TotalPurchases { get; set; }
    public decimal GrossProfit { get; set; }
    public int SalesInvoiceCount { get; set; }
    public int PurchaseInvoiceCount { get; set; }
}

public class CustomerReportDto
{
    public int CustomerId { get; set; }
    public string CustomerCode { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public decimal TotalSpent { get; set; }
    public int PurchaseCount { get; set; }
    public decimal PendingCredit { get; set; }
}
