using System.Linq.Expressions;
using Backend.Data;
using Backend.DTOs.Vendor;
using Backend.Models;
using Backend.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services;

public class VendorService : IVendorService
{
    private readonly AppDbContext _dbContext;

    public VendorService(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<IReadOnlyList<VendorDto>> GetAllAsync()
    {
        return await _dbContext.Vendors
            .AsNoTracking()
            .OrderBy(x => x.VendorName)
            .Select(MapToDto())
            .ToListAsync();
    }

    public async Task<VendorDto?> GetByIdAsync(int vendorId)
    {
        return await _dbContext.Vendors
            .AsNoTracking()
            .Where(x => x.VendorId == vendorId)
            .Select(MapToDto())
            .FirstOrDefaultAsync();
    }

    public async Task<VendorDto> CreateAsync(CreateVendorDto request)
    {
        var vendor = new Vendor
        {
            VendorName = request.VendorName,
            ContactPerson = request.ContactPerson,
            PhoneNumber = request.PhoneNumber,
            Email = request.Email,
            Address = request.Address,
            IsActive = request.IsActive
        };

        _dbContext.Vendors.Add(vendor);
        await _dbContext.SaveChangesAsync();

        return ToDto(vendor);
    }

    public async Task<VendorDto?> UpdateAsync(int vendorId, UpdateVendorDto request)
    {
        var vendor = await _dbContext.Vendors.FirstOrDefaultAsync(x => x.VendorId == vendorId);
        if (vendor is null)
        {
            return null;
        }

        vendor.VendorName = request.VendorName;
        vendor.ContactPerson = request.ContactPerson;
        vendor.PhoneNumber = request.PhoneNumber;
        vendor.Email = request.Email;
        vendor.Address = request.Address;
        vendor.IsActive = request.IsActive;

        await _dbContext.SaveChangesAsync();
        return ToDto(vendor);
    }

    public async Task<bool> DeleteAsync(int vendorId)
    {
        var vendor = await _dbContext.Vendors.FirstOrDefaultAsync(x => x.VendorId == vendorId);
        if (vendor is null)
        {
            return false;
        }

        _dbContext.Vendors.Remove(vendor);
        await _dbContext.SaveChangesAsync();
        return true;
    }

    private static VendorDto ToDto(Vendor vendor) => new()
    {
        VendorId = vendor.VendorId,
        VendorName = vendor.VendorName,
        ContactPerson = vendor.ContactPerson,
        PhoneNumber = vendor.PhoneNumber,
        Email = vendor.Email,
        Address = vendor.Address,
        IsActive = vendor.IsActive
    };

    private static Expression<Func<Vendor, VendorDto>> MapToDto() => vendor => new VendorDto
    {
        VendorId = vendor.VendorId,
        VendorName = vendor.VendorName,
        ContactPerson = vendor.ContactPerson,
        PhoneNumber = vendor.PhoneNumber,
        Email = vendor.Email,
        Address = vendor.Address,
        IsActive = vendor.IsActive
    };
}
