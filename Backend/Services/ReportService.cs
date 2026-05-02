using Backend.Data;
using Backend.DTOs.Report;
using Backend.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services;

public class ReportService : IReportService
{
    private readonly AppDbContext _dbContext;

    public ReportService(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<FinancialReportDto> GetFinancialReportAsync(string period, DateTime? date)
    {
        var referenceDate = (date ?? DateTime.UtcNow).Date;
        referenceDate = DateTime.SpecifyKind(referenceDate, DateTimeKind.Utc);

        DateTime start;
        DateTime end;
        period = period.Trim().ToLowerInvariant();

        switch (period)
        {
            case "daily":
                start = referenceDate;
                end = start.AddDays(1);
                break;
            case "weekly":
                start = referenceDate.AddDays(-(int)referenceDate.DayOfWeek);
                end = start.AddDays(7);
                break;
            case "monthly":
                start = new DateTime(referenceDate.Year, referenceDate.Month, 1, 0, 0, 0, DateTimeKind.Utc);
                end = start.AddMonths(1);
                break;
            case "yearly":
                start = new DateTime(referenceDate.Year, 1, 1, 0, 0, 0, DateTimeKind.Utc);
                end = start.AddYears(1);
                break;
            default:
                throw new InvalidOperationException("Invalid period. Use daily, weekly, monthly, or yearly.");
        }

        var sales = await _dbContext.SalesInvoices
            .AsNoTracking()
            .Where(x => x.InvoiceDate >= start && x.InvoiceDate < end)
            .ToListAsync();

        var purchases = await _dbContext.PurchaseInvoices
            .AsNoTracking()
            .Where(x => x.InvoiceDate >= start && x.InvoiceDate < end)
            .ToListAsync();

        var totalSales = sales.Sum(x => x.TotalAmount);
        var totalPurchases = purchases.Sum(x => x.TotalAmount);

        return new FinancialReportDto
        {
            Period = period,
            StartDate = start,
            EndDate = end.AddTicks(-1),
            TotalSales = totalSales,
            TotalPurchases = totalPurchases,
            GrossProfit = totalSales - totalPurchases,
            SalesInvoiceCount = sales.Count,
            PurchaseInvoiceCount = purchases.Count
        };
    }

    public async Task<IReadOnlyList<CustomerReportDto>> GetRegularCustomersAsync(int minPurchases)
    {
        return await BuildCustomerReportBaseQuery()
            .Where(x => x.PurchaseCount >= minPurchases)
            .OrderByDescending(x => x.PurchaseCount)
            .ToListAsync();
    }

    public async Task<IReadOnlyList<CustomerReportDto>> GetHighSpendersAsync(decimal minSpent)
    {
        return await BuildCustomerReportBaseQuery()
            .Where(x => x.TotalSpent >= minSpent)
            .OrderByDescending(x => x.TotalSpent)
            .ToListAsync();
    }

    public async Task<IReadOnlyList<CustomerReportDto>> GetPendingCreditsAsync(int overdueDays)
    {
        return await BuildCustomerReportBaseQuery()
            .Where(x => x.PendingCredit > 0)
            .OrderByDescending(x => x.PendingCredit)
            .ToListAsync();
    }

    private IQueryable<CustomerReportDto> BuildCustomerReportBaseQuery()
    {
        return _dbContext.Customers
            .AsNoTracking()
            .Include(x => x.User)
            .Select(x => new CustomerReportDto
            {
                CustomerId = x.CustomerId,
                CustomerCode = x.CustomerCode,
                FullName = x.User.FullName,
                PhoneNumber = x.User.PhoneNumber,
                TotalSpent = x.SalesInvoices.Sum(s => s.TotalAmount),
                PurchaseCount = x.SalesInvoices.Count,
                PendingCredit = x.SalesInvoices.Sum(s => s.BalanceAmount)
            });
    }
}
