using Backend.DTOs.Invoice;

namespace Backend.Services.Interfaces;

public interface IInvoiceService
{
    Task<PurchaseInvoiceDto> CreatePurchaseInvoiceAsync(CreatePurchaseInvoiceDto request);
    Task<PurchaseInvoiceDto?> UpdatePurchaseInvoiceAsync(int purchaseInvoiceId, UpdatePurchaseInvoiceDto request);
    Task<bool> DeletePurchaseInvoiceAsync(int purchaseInvoiceId);
    Task<IReadOnlyList<PurchaseInvoiceDto>> GetAllPurchaseInvoicesAsync();
    Task<SalesInvoiceDto> CreateSalesInvoiceAsync(CreateSalesInvoiceDto request);
    Task<IReadOnlyList<SalesInvoiceDto>> GetAllSalesInvoicesAsync();
    Task<bool> SendSalesInvoiceEmailAsync(int salesInvoiceId, string email);
}
