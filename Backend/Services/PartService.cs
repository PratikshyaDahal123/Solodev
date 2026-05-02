using Backend.Data;
using Backend.DTOs.Parts;
using Backend.Models;
using Backend.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services;

public class PartService : IPartService
{
    private readonly AppDbContext _dbContext;

    public PartService(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<IReadOnlyList<PartDto>> GetAllAsync()
    {
        return await _dbContext.Parts
            .AsNoTracking()
            .Include(x => x.Vendor)
            .Include(x => x.Category)
            .OrderBy(x => x.PartName)
            .Select(part => new PartDto
            {
                PartId = part.PartId,
                PartCode = part.PartCode,
                PartName = part.PartName,
                Description = part.Description,
                CostPrice = part.CostPrice,
                UnitPrice = part.UnitPrice,
                StockQuantity = part.StockQuantity,
                ReorderLevel = part.ReorderLevel,
                VendorId = part.VendorId,
                VendorName = part.Vendor != null ? part.Vendor.VendorName : null,
                CategoryId = part.CategoryId,
                CategoryName = part.Category != null ? part.Category.CategoryName : null,
                IsActive = part.IsActive
            })
            .ToListAsync();
    }

    public async Task<PartDto?> GetByIdAsync(int partId)
    {
        return await _dbContext.Parts
            .AsNoTracking()
            .Include(x => x.Vendor)
            .Include(x => x.Category)
            .Where(x => x.PartId == partId)
            .Select(part => new PartDto
            {
                PartId = part.PartId,
                PartCode = part.PartCode,
                PartName = part.PartName,
                Description = part.Description,
                CostPrice = part.CostPrice,
                UnitPrice = part.UnitPrice,
                StockQuantity = part.StockQuantity,
                ReorderLevel = part.ReorderLevel,
                VendorId = part.VendorId,
                VendorName = part.Vendor != null ? part.Vendor.VendorName : null,
                CategoryId = part.CategoryId,
                CategoryName = part.Category != null ? part.Category.CategoryName : null,
                IsActive = part.IsActive
            })
            .FirstOrDefaultAsync();
    }

    public async Task<PartDto> CreateAsync(CreatePartDto request)
    {
        var partCodeExists = await _dbContext.Parts.AnyAsync(x => x.PartCode == request.PartCode);
        if (partCodeExists)
        {
            throw new InvalidOperationException("Part code already exists.");
        }

        if (request.CategoryId.HasValue)
        {
            var categoryExists = await _dbContext.Categories.AnyAsync(x => x.CategoryId == request.CategoryId.Value);
            if (!categoryExists)
            {
                throw new InvalidOperationException("Category not found.");
            }
        }

        var part = new Part
        {
            PartCode = request.PartCode,
            PartName = request.PartName,
            Description = request.Description,
            CostPrice = request.CostPrice,
            UnitPrice = request.UnitPrice,
            ReorderLevel = request.ReorderLevel,
            CategoryId = request.CategoryId,
            IsActive = request.IsActive
        };

        _dbContext.Parts.Add(part);
        await _dbContext.SaveChangesAsync();

        return await GetByIdAsync(part.PartId) ?? ToDto(part);
    }

    public async Task<PartDto?> UpdateAsync(int partId, UpdatePartDto request)
    {
        var part = await _dbContext.Parts.FirstOrDefaultAsync(x => x.PartId == partId);
        if (part is null)
        {
            return null;
        }

        if (request.CategoryId.HasValue)
        {
            var categoryExists = await _dbContext.Categories.AnyAsync(x => x.CategoryId == request.CategoryId.Value);
            if (!categoryExists)
            {
                throw new InvalidOperationException("Category not found.");
            }
        }

        part.PartName = request.PartName;
        part.Description = request.Description;
        part.CostPrice = request.CostPrice;
        part.UnitPrice = request.UnitPrice;
        part.ReorderLevel = request.ReorderLevel;
        part.CategoryId = request.CategoryId;
        part.IsActive = request.IsActive;

        await _dbContext.SaveChangesAsync();
        return await GetByIdAsync(part.PartId);
    }

    public async Task<bool> DeleteAsync(int partId)
    {
        var part = await _dbContext.Parts
            .Include(p => p.PurchaseInvoiceItems)
            .Include(p => p.SalesInvoiceItems)
            .FirstOrDefaultAsync(x => x.PartId == partId);

        if (part is null)
        {
            return false;
        }

        await using var tx = await _dbContext.Database.BeginTransactionAsync();

        if (part.PurchaseInvoiceItems?.Any() == true)
        {
            _dbContext.PurchaseInvoiceItems.RemoveRange(part.PurchaseInvoiceItems);
        }

        if (part.SalesInvoiceItems?.Any() == true)
        {
            _dbContext.SalesInvoiceItems.RemoveRange(part.SalesInvoiceItems);
        }

        _dbContext.Parts.Remove(part);
        await _dbContext.SaveChangesAsync();
        await tx.CommitAsync();

        return true;
    }

    private static PartDto ToDto(Part part) => new()
    {
        PartId = part.PartId,
        PartCode = part.PartCode,
        PartName = part.PartName,
        Description = part.Description,
        CostPrice = part.CostPrice,
        UnitPrice = part.UnitPrice,
        StockQuantity = part.StockQuantity,
        ReorderLevel = part.ReorderLevel,
        VendorId = part.VendorId,
        VendorName = part.Vendor?.VendorName,
        CategoryId = part.CategoryId,
        CategoryName = part.Category?.CategoryName,
        IsActive = part.IsActive
    };
}
