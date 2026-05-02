using Backend.Data;
using Backend.DTOs.Invoice;
using Backend.Enums;
using Backend.Models;
using Backend.Services.Interfaces;
using Microsoft.Extensions.Options;
using Backend.DTOs;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace Backend.Services;

public class InvoiceService : IInvoiceService
{
    private const decimal VatRate = 0.13m;
    private readonly AppDbContext _dbContext;
    private readonly IEmailService _emailService;
    private readonly INotificationService _notificationService;
    private readonly LoyaltySettings _loyaltySettings;
    private readonly IConfiguration _configuration;

    public InvoiceService(AppDbContext dbContext, IEmailService emailService, INotificationService notificationService, IOptions<LoyaltySettings> loyaltyOptions, IConfiguration configuration)
    {
        _dbContext = dbContext;
        _emailService = emailService;
        _notificationService = notificationService;
        _loyaltySettings = loyaltyOptions?.Value ?? new LoyaltySettings();
        _configuration = configuration;
    }

    public async Task<PurchaseInvoiceDto> CreatePurchaseInvoiceAsync(CreatePurchaseInvoiceDto request)
    {
        var vendorExists = await _dbContext.Vendors.AnyAsync(x => x.VendorId == request.VendorId);
        if (!vendorExists)
        {
            throw new InvalidOperationException("Vendor not found.");
        }

        if (request.StaffId.HasValue)
        {
            var staffExists = await _dbContext.Staffs.AnyAsync(x => x.StaffId == request.StaffId.Value);
            if (!staffExists)
            {
                throw new InvalidOperationException("Staff not found.");
            }
        }

        var invoice = new PurchaseInvoice
        {
            InvoiceNumber = $"PINV-{DateTime.UtcNow:yyyyMMddHHmmssfff}",
            VendorId = request.VendorId,
            StaffId = request.StaffId,
            InvoiceDate = DateTime.UtcNow,
            Notes = request.Notes
        };

        var items = new List<PurchaseInvoiceItem>();
        decimal subtotal = 0;

        foreach (var item in request.Items)
        {
            var part = await _dbContext.Parts.FirstOrDefaultAsync(x => x.PartId == item.PartId);
            if (part is null)
            {
                throw new InvalidOperationException($"Part not found: {item.PartId}");
            }

            var qty = item.Quantity;
            if (qty <= 0)
            {
                qty = Math.Max(part.StockQuantity, 1);
            }

            var lineTotal = qty * item.UnitCost;
            subtotal += lineTotal;

            part.StockQuantity += qty;

            items.Add(new PurchaseInvoiceItem
            {
                PartId = item.PartId,
                Quantity = qty,
                UnitCost = item.UnitCost,
                LineTotal = lineTotal
            });
        }

        var vatAmount = Math.Round(subtotal * VatRate, 2, MidpointRounding.AwayFromZero);
        invoice.Subtotal = subtotal;
        invoice.TaxAmount = vatAmount;
        invoice.TotalAmount = subtotal + vatAmount;
        invoice.Items = items;

        _dbContext.PurchaseInvoices.Add(invoice);
        await _dbContext.SaveChangesAsync();

        return MapPurchaseInvoice(invoice);
    }

    public async Task<PurchaseInvoiceDto?> UpdatePurchaseInvoiceAsync(int purchaseInvoiceId, UpdatePurchaseInvoiceDto request)
    {
        var invoice = await _dbContext.PurchaseInvoices
            .Include(x => x.Items)
            .FirstOrDefaultAsync(x => x.PurchaseInvoiceId == purchaseInvoiceId);

        if (invoice is null)
        {
            return null;
        }

        var vendorExists = await _dbContext.Vendors.AnyAsync(x => x.VendorId == request.VendorId);
        if (!vendorExists)
        {
            throw new InvalidOperationException("Vendor not found.");
        }

        if (request.StaffId.HasValue)
        {
            var staffExists = await _dbContext.Staffs.AnyAsync(x => x.StaffId == request.StaffId.Value);
            if (!staffExists)
            {
                throw new InvalidOperationException("Staff not found.");
            }
        }

        await using var tx = await _dbContext.Database.BeginTransactionAsync();

        var oldItems = invoice.Items.ToList();
        var oldPartIds = oldItems.Select(x => x.PartId).Distinct().ToList();
        var oldParts = await _dbContext.Parts.Where(x => oldPartIds.Contains(x.PartId)).ToListAsync();

        foreach (var item in oldItems)
        {
            var part = oldParts.FirstOrDefault(x => x.PartId == item.PartId);
            if (part is null)
            {
                throw new InvalidOperationException($"Part not found: {item.PartId}");
            }

            if (part.StockQuantity - item.Quantity < 0)
            {
                throw new InvalidOperationException($"Insufficient stock to update invoice for part: {part.PartName}");
            }

            part.StockQuantity -= item.Quantity;
        }

        _dbContext.PurchaseInvoiceItems.RemoveRange(oldItems);

        var items = new List<PurchaseInvoiceItem>();
        decimal subtotal = 0;

        foreach (var item in request.Items)
        {
            var part = await _dbContext.Parts.FirstOrDefaultAsync(x => x.PartId == item.PartId);
            if (part is null)
            {
                throw new InvalidOperationException($"Part not found: {item.PartId}");
            }

            var qty = item.Quantity;
            if (qty <= 0)
            {
                qty = Math.Max(part.StockQuantity, 1);
            }

            var lineTotal = qty * item.UnitCost;
            subtotal += lineTotal;

            part.StockQuantity += qty;

            items.Add(new PurchaseInvoiceItem
            {
                PartId = item.PartId,
                Quantity = qty,
                UnitCost = item.UnitCost,
                LineTotal = lineTotal
            });
        }

        var vatAmount = Math.Round(subtotal * VatRate, 2, MidpointRounding.AwayFromZero);
        invoice.VendorId = request.VendorId;
        invoice.StaffId = request.StaffId;
        invoice.Subtotal = subtotal;
        invoice.TaxAmount = vatAmount;
        invoice.TotalAmount = subtotal + vatAmount;
        invoice.Notes = request.Notes;
        invoice.Items = items;

        await _dbContext.SaveChangesAsync();
        await tx.CommitAsync();

        return MapPurchaseInvoice(invoice);
    }

    public async Task<bool> DeletePurchaseInvoiceAsync(int purchaseInvoiceId)
    {
        var invoice = await _dbContext.PurchaseInvoices
            .Include(x => x.Items)
            .FirstOrDefaultAsync(x => x.PurchaseInvoiceId == purchaseInvoiceId);

        if (invoice is null)
        {
            return false;
        }

        await using var tx = await _dbContext.Database.BeginTransactionAsync();

        var partIds = invoice.Items.Select(x => x.PartId).Distinct().ToList();
        var parts = await _dbContext.Parts.Where(x => partIds.Contains(x.PartId)).ToListAsync();

        foreach (var item in invoice.Items)
        {
            var part = parts.FirstOrDefault(x => x.PartId == item.PartId);
            if (part is null)
            {
                throw new InvalidOperationException($"Part not found: {item.PartId}");
            }

            if (part.StockQuantity - item.Quantity < 0)
            {
                throw new InvalidOperationException($"Insufficient stock to delete invoice for part: {part.PartName}");
            }

            part.StockQuantity -= item.Quantity;
        }

        _dbContext.PurchaseInvoices.Remove(invoice);
        await _dbContext.SaveChangesAsync();
        await tx.CommitAsync();

        return true;
    }

    public async Task<IReadOnlyList<PurchaseInvoiceDto>> GetAllPurchaseInvoicesAsync()
    {
        var invoices = await _dbContext.PurchaseInvoices
            .Include(x => x.Vendor)
            .Include(x => x.Staff)
            .Include(x => x.Items)
            .OrderByDescending(x => x.InvoiceDate)
            .ToListAsync();

        return invoices.Select(MapPurchaseInvoice).ToList();
    }

    private static PurchaseInvoiceDto MapPurchaseInvoice(PurchaseInvoice invoice)
    {
        return new PurchaseInvoiceDto
        {
            PurchaseInvoiceId = invoice.PurchaseInvoiceId,
            InvoiceNumber = invoice.InvoiceNumber,
            VendorId = invoice.VendorId,
            StaffId = invoice.StaffId,
            InvoiceDate = invoice.InvoiceDate,
            Subtotal = invoice.Subtotal,
            TaxAmount = invoice.TaxAmount,
            TotalAmount = invoice.TotalAmount,
            Notes = invoice.Notes,
            Items = invoice.Items.Select(x => new PurchaseInvoiceItemDto
            {
                PurchaseInvoiceItemId = x.PurchaseInvoiceItemId,
                PartId = x.PartId,
                Quantity = x.Quantity,
                UnitCost = x.UnitCost,
                LineTotal = x.LineTotal
            }).ToList()
        };
    }

    public async Task<SalesInvoiceDto> CreateSalesInvoiceAsync(CreateSalesInvoiceDto request)
    {
        var customer = await _dbContext.Customers.FirstOrDefaultAsync(x => x.CustomerId == request.CustomerId);
        if (customer is null)
        {
            throw new InvalidOperationException("Customer not found.");
        }

        if (request.VehicleId.HasValue)
        {
            var vehicleExists = await _dbContext.Vehicles.AnyAsync(x => x.VehicleId == request.VehicleId.Value);
            if (!vehicleExists)
            {
                throw new InvalidOperationException("Vehicle not found.");
            }
        }

        if (request.StaffId.HasValue)
        {
            var staffExists = await _dbContext.Staffs.AnyAsync(x => x.StaffId == request.StaffId.Value);
            if (!staffExists)
            {
                throw new InvalidOperationException("Staff not found.");
            }
        }

        var invoice = new SalesInvoice
        {
            InvoiceNumber = $"SINV-{DateTime.UtcNow:yyyyMMddHHmmssfff}",
            CustomerId = request.CustomerId,
            VehicleId = request.VehicleId,
            StaffId = request.StaffId,
            InvoiceDate = DateTime.UtcNow,
            Notes = request.Notes
        };

        var items = new List<SalesInvoiceItem>();
        decimal subtotal = 0;
        decimal totalDiscount = 0;

        foreach (var item in request.Items)
        {
            var part = await _dbContext.Parts.FirstOrDefaultAsync(x => x.PartId == item.PartId);
            if (part is null)
            {
                throw new InvalidOperationException($"Part not found: {item.PartId}");
            }

            if (part.StockQuantity < item.Quantity)
            {
                throw new InvalidOperationException($"Insufficient stock for part: {part.PartName}");
            }

            var gross = item.Quantity * item.UnitPrice;
            var lineTotal = gross - item.Discount;
            if (lineTotal < 0)
            {
                throw new InvalidOperationException("Invalid discount amount.");
            }

            subtotal += gross;
            totalDiscount += item.Discount;
            part.StockQuantity -= item.Quantity;

            // If stock falls below reorder level (default 10) notify admins
            try
            {
                var reorderThreshold = part.ReorderLevel > 0 ? part.ReorderLevel : 10;
                await _notificationService.NotifyPartLowStockAsync(part.PartId, part.StockQuantity, reorderThreshold);
            }
            catch
            {
                // swallow notification errors to avoid breaking sales flow
            }

            items.Add(new SalesInvoiceItem
            {
                PartId = item.PartId,
                Quantity = item.Quantity,
                UnitPrice = item.UnitPrice,
                Discount = item.Discount,
                LineTotal = lineTotal
            });
        }

        var threshold = _loyaltySettings.Threshold;
        var rate = _loyaltySettings.Rate;
        var amountAfterLineDiscount = subtotal - totalDiscount;
        var loyaltyDiscount = subtotal > threshold
            ? Math.Round(amountAfterLineDiscount * rate, 2)
            : 0m;
        totalDiscount += loyaltyDiscount;

        var totalAmount = subtotal - totalDiscount;
        var balance = Math.Max(totalAmount - request.AmountPaid, 0);
        var outstandingCredit = balance;

        invoice.Subtotal = subtotal;
        invoice.DiscountAmount = totalDiscount;
        invoice.TotalAmount = totalAmount;
        invoice.AmountPaid = request.AmountPaid;
        invoice.BalanceAmount = balance;
        invoice.Status = balance <= 0 ? InvoiceStatus.Paid : InvoiceStatus.PartiallyPaid;
        invoice.IsCreditSale = balance > 0;
        invoice.Items = items;

        customer.TotalSpent += totalAmount;
        customer.CreditBalance += outstandingCredit;
        if (loyaltyDiscount > 0)
        {
            invoice.Notes = string.IsNullOrWhiteSpace(invoice.Notes)
                ? "Loyalty discount of 10% applied."
                : $"{invoice.Notes} | Loyalty discount of 10% applied.";
        }

        _dbContext.SalesInvoices.Add(invoice);
        await _dbContext.SaveChangesAsync();

        return new SalesInvoiceDto
        {
            SalesInvoiceId = invoice.SalesInvoiceId,
            InvoiceNumber = invoice.InvoiceNumber,
            CustomerId = invoice.CustomerId,
            VehicleId = invoice.VehicleId,
            StaffId = invoice.StaffId,
            InvoiceDate = invoice.InvoiceDate,
            Subtotal = invoice.Subtotal,
            DiscountAmount = invoice.DiscountAmount,
            TotalAmount = invoice.TotalAmount,
            AmountPaid = invoice.AmountPaid,
            BalanceAmount = invoice.BalanceAmount,
            Status = invoice.Status.ToString(),
            IsCreditSale = invoice.IsCreditSale,
            Notes = invoice.Notes,
            CustomerName = customer?.User?.FullName ?? null,
            CustomerEmail = customer?.User?.Email ?? null,
            Items = invoice.Items.Select(x => new SalesInvoiceItemDto
            {
                SalesInvoiceItemId = x.SalesInvoiceItemId,
                PartId = x.PartId,
                Quantity = x.Quantity,
                UnitPrice = x.UnitPrice,
                Discount = x.Discount,
                LineTotal = x.LineTotal
            }).ToList()
        };
    }

    public async Task<IReadOnlyList<SalesInvoiceDto>> GetAllSalesInvoicesAsync()
    {
        var invoices = await _dbContext.SalesInvoices
            .Include(x => x.Customer)
                .ThenInclude(c => c.User)
            .Include(x => x.Staff)
            .Include(x => x.Items)
            .OrderByDescending(x => x.InvoiceDate)
            .ToListAsync();

        return invoices.Select(invoice => new SalesInvoiceDto
        {
            SalesInvoiceId = invoice.SalesInvoiceId,
            InvoiceNumber = invoice.InvoiceNumber,
            CustomerId = invoice.CustomerId,
            VehicleId = invoice.VehicleId,
            StaffId = invoice.StaffId,
            InvoiceDate = invoice.InvoiceDate,
            Subtotal = invoice.Subtotal,
            DiscountAmount = invoice.DiscountAmount,
            TotalAmount = invoice.TotalAmount,
            AmountPaid = invoice.AmountPaid,
            BalanceAmount = invoice.BalanceAmount,
            Status = invoice.Status.ToString(),
            IsCreditSale = invoice.IsCreditSale,
            Notes = invoice.Notes,
            CustomerName = invoice.Customer?.User?.FullName ?? null,
            CustomerEmail = invoice.Customer?.User?.Email ?? null,
            Items = invoice.Items.Select(x => new SalesInvoiceItemDto
            {
                SalesInvoiceItemId = x.SalesInvoiceItemId,
                PartId = x.PartId,
                Quantity = x.Quantity,
                UnitPrice = x.UnitPrice,
                Discount = x.Discount,
                LineTotal = x.LineTotal
            }).ToList()
        }).ToList();
    }

    public async Task<bool> SendSalesInvoiceEmailAsync(int salesInvoiceId, string email)
    {
        var invoice = await _dbContext.SalesInvoices
            .Include(x => x.Customer)
                .ThenInclude(c => c.User)
            .Include(x => x.Items)
                .ThenInclude(i => i.Part)
            .Include(x => x.Vehicle)
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.SalesInvoiceId == salesInvoiceId);

        if (invoice is null)
        {
            return false;
        }

        var fromName = _configuration["SmtpSettings:FromName"] ?? _configuration["Email:FromName"] ?? "SawariSync";
        var subject = $"Sales Invoice - {invoice.InvoiceNumber}";

        var statusBadgeClass = invoice.Status.ToString() == "Paid" ? "badge-paid" : "badge-partial";
        var statusLabel = invoice.Status.ToString();

        var customerName = invoice.Customer?.User?.FullName ?? "Customer";
        var customerCode = invoice.Customer?.CustomerCode ?? "";
        var customerEmail = invoice.Customer?.User?.Email ?? email;

        var vehicleInfo = "";
        if (invoice.Vehicle != null)
        {
            var vehicleBrand = invoice.Vehicle.Brand ?? "";
            var vehicleModel = invoice.Vehicle.Model ?? "";
            var vehicleReg = invoice.Vehicle.RegistrationNumber ?? "";
            vehicleInfo = $@"<p class=""info-text"">Vehicle: <strong>{vehicleReg}</strong> ({vehicleBrand} {vehicleModel})</p>";
        }

        var itemsBuilder = new System.Text.StringBuilder();
        foreach (var item in invoice.Items)
        {
            var partName = item.Part?.PartName ?? "Unknown Part";
            var partCode = item.Part?.PartCode ?? "";
            itemsBuilder.Append($@"
                <tr>
                    <td style=""padding: 12px; border-bottom: 1px solid #f1f5f9; font-size: 14px; color: #334155;"">
                        <strong>{partName}</strong><br/>
                        <span style=""font-size: 11px; color: #94a3b8;"">{partCode}</span>
                    </td>
                    <td class=""text-right"" style=""padding: 12px; border-bottom: 1px solid #f1f5f9; font-size: 14px; color: #334155; text-align: right;"">{item.Quantity}</td>
                    <td class=""text-right"" style=""padding: 12px; border-bottom: 1px solid #f1f5f9; font-size: 14px; color: #334155; text-align: right;"">Rs {item.UnitPrice:F2}</td>
                    <td class=""text-right"" style=""padding: 12px; border-bottom: 1px solid #f1f5f9; font-size: 14px; color: #334155; text-align: right;"">Rs {item.Discount:F2}</td>
                    <td class=""text-right"" style=""padding: 12px; border-bottom: 1px solid #f1f5f9; font-size: 14px; color: #334155; text-align: right;"">Rs {item.LineTotal:F2}</td>
                </tr>");
        }

        var notesSection = string.IsNullOrWhiteSpace(invoice.Notes) ? "" : $@"
            <div style=""margin-top: 20px; padding: 15px; background-color: #f8fafc; border-radius: 8px; border-left: 4px solid #10b981;"">
                <h4 style=""margin: 0 0 8px 0; font-size: 12px; text-transform: uppercase; color: #94a3b8; font-weight: bold;"">Notes</h4>
                <p style=""font-size: 13px; margin: 0; color: #475569;"">{invoice.Notes}</p>
            </div>";

        var body = $@"<!DOCTYPE html>
<html>
<head>
    <meta charset=""utf-8"">
    <style>
        body {{
            font-family: 'Segoe UI', Helvetica, Arial, sans-serif;
            color: #333333;
            line-height: 1.6;
            margin: 0;
            padding: 0;
            background-color: #f6f9fc;
        }}
        .container {{
            max-width: 600px;
            margin: 40px auto;
            background: #ffffff;
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
            border-top: 6px solid #10b981;
        }}
        .header {{
            border-bottom: 2px solid #f0f3f6;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }}
        .header-title {{
            font-size: 24px;
            font-weight: 700;
            color: #10b981;
            margin: 0;
            text-transform: uppercase;
            letter-spacing: 1px;
        }}
        .header-subtitle {{
            font-size: 14px;
            color: #6b7280;
            margin: 5px 0 0 0;
        }}
        .invoice-details {{
            display: table;
            width: 100%;
            margin-bottom: 30px;
        }}
        .invoice-column {{
            display: table-cell;
            width: 50%;
            vertical-align: top;
        }}
        .section-title {{
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #9ca3af;
            margin: 0 0 8px 0;
            font-weight: bold;
        }}
        .info-text {{
            font-size: 14px;
            margin: 0 0 4px 0;
            color: #4b5563;
        }}
        .info-text strong {{
            color: #1f2937;
        }}
        .table {{
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
        }}
        .table th {{
            background-color: #f8fafc;
            border-bottom: 2px solid #e2e8f0;
            color: #475569;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            padding: 10px 12px;
            text-align: left;
        }}
        .table td {{
            padding: 12px;
            border-bottom: 1px solid #f1f5f9;
            font-size: 14px;
            color: #334155;
        }}
        .text-right {{
            text-align: right;
        }}
        .summary-container {{
            width: 60%;
            float: right;
            margin-bottom: 30px;
        }}
        .summary-row {{
            display: table;
            width: 100%;
            margin-bottom: 6px;
            font-size: 14px;
        }}
        .summary-label {{
            display: table-cell;
            color: #64748b;
            text-align: right;
            padding-right: 15px;
        }}
        .summary-value {{
            display: table-cell;
            text-align: right;
            font-weight: 600;
            color: #1e293b;
        }}
        .summary-total {{
            font-size: 17px;
            font-weight: 700;
            color: #10b981;
            border-top: 1px solid #e2e8f0;
            padding-top: 8px;
            margin-top: 8px;
        }}
        .footer {{
            clear: both;
            border-top: 1px solid #f0f3f6;
            padding-top: 20px;
            font-size: 12px;
            color: #9ca3af;
            text-align: center;
            line-height: 1.5;
        }}
        .badge {{
            display: inline-block;
            padding: 4px 10px;
            border-radius: 9999px;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
        }}
        .badge-paid {{
            background-color: #d1fae5;
            color: #065f46;
        }}
        .badge-partial {{
            background-color: #fef3c7;
            color: #92400e;
        }}
    </style>
</head>
<body>
    <div class=""container"">
        <div class=""header"">
            <table style=""width: 100%; border-collapse: collapse;"">
                <tr>
                    <td style=""padding: 0; border: none;"">
                        <h1 class=""header-title"">{fromName}</h1>
                        <p class=""header-subtitle"">Vehicle Service Center & Parts Sales</p>
                    </td>
                    <td style=""padding: 0; border: none; text-align: right; vertical-align: middle;"">
                        <span class=""badge {statusBadgeClass}"">{statusLabel}</span>
                    </td>
                </tr>
            </table>
        </div>

        <div style=""display: table; width: 100%; margin-bottom: 25px;"">
            <div style=""display: table-cell; width: 50%; vertical-align: top;"">
                <h2 class=""section-title"">Billed To</h2>
                <p class=""info-text""><strong>{customerName}</strong></p>
                <p class=""info-text"">Customer Code: #{customerCode}</p>
                <p class=""info-text"">{customerEmail}</p>
            </div>
            <div style=""display: table-cell; width: 50%; vertical-align: top; text-align: right;"">
                <h2 class=""section-title"">Invoice Info</h2>
                <p class=""info-text""><strong>Invoice #: {invoice.InvoiceNumber}</strong></p>
                <p class=""info-text"">Date: {invoice.InvoiceDate:yyyy-MM-dd HH:mm}</p>
                {vehicleInfo}
            </div>
        </div>

        <table class=""table"">
            <thead>
                <tr>
                    <th style=""background-color: #f8fafc; border-bottom: 2px solid #e2e8f0; color: #475569; font-size: 11px; font-weight: 600; text-transform: uppercase; padding: 10px 12px; text-align: left;"">Part / Item</th>
                    <th class=""text-right"" style=""background-color: #f8fafc; border-bottom: 2px solid #e2e8f0; color: #475569; font-size: 11px; font-weight: 600; text-transform: uppercase; padding: 10px 12px; text-align: right; width: 50px;"">Qty</th>
                    <th class=""text-right"" style=""background-color: #f8fafc; border-bottom: 2px solid #e2e8f0; color: #475569; font-size: 11px; font-weight: 600; text-transform: uppercase; padding: 10px 12px; text-align: right; width: 80px;"">Price</th>
                    <th class=""text-right"" style=""background-color: #f8fafc; border-bottom: 2px solid #e2e8f0; color: #475569; font-size: 11px; font-weight: 600; text-transform: uppercase; padding: 10px 12px; text-align: right; width: 80px;"">Discount</th>
                    <th class=""text-right"" style=""background-color: #f8fafc; border-bottom: 2px solid #e2e8f0; color: #475569; font-size: 11px; font-weight: 600; text-transform: uppercase; padding: 10px 12px; text-align: right; width: 90px;"">Total</th>
                </tr>
            </thead>
            <tbody>
                {itemsBuilder}
            </tbody>
        </table>

        <div style=""width: 100%; display: inline-block; margin-top: 15px;"">
            <div class=""summary-container"">
                <div class=""summary-row"">
                    <div class=""summary-label"">Subtotal:</div>
                    <div class=""summary-value"">Rs {invoice.Subtotal:F2}</div>
                </div>
                <div class=""summary-row"">
                    <div class=""summary-label"">Discount:</div>
                    <div class=""summary-value"">Rs {invoice.DiscountAmount:F2}</div>
                </div>
                <div class=""summary-row summary-total"">
                    <div class=""summary-label"">Total Amount:</div>
                    <div class=""summary-value"">Rs {invoice.TotalAmount:F2}</div>
                </div>
                <div class=""summary-row"" style=""margin-top: 8px;"">
                    <div class=""summary-label"">Amount Paid:</div>
                    <div class=""summary-value"">Rs {invoice.AmountPaid:F2}</div>
                </div>
                <div class=""summary-row"" style=""font-weight: bold; margin-top: 4px;"">
                    <div class=""summary-label"">Balance Due:</div>
                    <div class=""summary-value"" style=""color: {((invoice.BalanceAmount > 0) ? "#ef4444" : "#10b981")};"">Rs {invoice.BalanceAmount:F2}</div>
                </div>
            </div>
        </div>

        {notesSection}

        <div class=""footer"" style=""margin-top: 30px;"">
            <p>Thank you for choosing {fromName}!</p>
            <p>If you have any queries about this invoice, please feel free to reach out.</p>
        </div>
    </div>
</body>
</html>";

        return await _emailService.SendInvoiceAsync(email, subject, body);
    }
}
