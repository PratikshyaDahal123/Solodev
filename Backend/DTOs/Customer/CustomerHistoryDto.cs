namespace Backend.DTOs.Customer;

public class CustomerHistoryDto
{
    public int CustomerId { get; set; }
    public IReadOnlyList<CustomerPurchaseHistoryItemDto> Purchases { get; set; } = [];
    public IReadOnlyList<CustomerAppointmentHistoryItemDto> Appointments { get; set; } = [];
}

public class CustomerPurchaseHistoryItemDto
{
    public int SalesInvoiceId { get; set; }
    public string InvoiceNumber { get; set; } = string.Empty;
    public DateTime InvoiceDate { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal BalanceAmount { get; set; }
    public string Status { get; set; } = string.Empty;
}

public class CustomerAppointmentHistoryItemDto
{
    public int AppointmentId { get; set; }
    public DateTime AppointmentDateTime { get; set; }
    public string ServiceType { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public ReviewDto? Review { get; set; }
}
