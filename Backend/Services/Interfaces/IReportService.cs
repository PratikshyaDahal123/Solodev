using Backend.DTOs.Report;

namespace Backend.Services.Interfaces;

public interface IReportService
{
    Task<FinancialReportDto> GetFinancialReportAsync(string period, DateTime? date);
    Task<IReadOnlyList<CustomerReportDto>> GetRegularCustomersAsync(int minPurchases);
    Task<IReadOnlyList<CustomerReportDto>> GetHighSpendersAsync(decimal minSpent);
    Task<IReadOnlyList<CustomerReportDto>> GetPendingCreditsAsync(int overdueDays);
}
