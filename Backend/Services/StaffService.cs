using Backend.Data;
using Backend.DTOs.Staff;
using Backend.Enums;
using Backend.Models;
using Backend.Services.Interfaces;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services;

public class StaffService : IStaffService
{
    private readonly AppDbContext _dbContext;
    private readonly IPasswordHasher<User> _passwordHasher;

    public StaffService(AppDbContext dbContext, IPasswordHasher<User> passwordHasher)
    {
        _dbContext = dbContext;
        _passwordHasher = passwordHasher;
    }

    public async Task<StaffDto> RegisterAsync(CreateStaffDto request)
    {
        if (await _dbContext.Users.AnyAsync(x => x.Email == request.Email))
            throw new InvalidOperationException("Email is already in use.");

        if (await _dbContext.Users.AnyAsync(x => x.PhoneNumber == request.PhoneNumber))
            throw new InvalidOperationException("Phone number is already in use.");

        if (await _dbContext.Staffs.AnyAsync(x => x.EmployeeCode == request.EmployeeCode))
            throw new InvalidOperationException("Employee code already exists.");

        var user = new User
        {
            FullName = request.FullName,
            Email = request.Email,
            PhoneNumber = request.PhoneNumber,
            Role = UserRole.Staff,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
        user.PasswordHash = _passwordHasher.HashPassword(user, request.Password);

        _dbContext.Users.Add(user);
        await _dbContext.SaveChangesAsync();

        var staff = new Staff
        {
            UserId = user.UserId,
            EmployeeCode = request.EmployeeCode,
            JobTitle = request.JobTitle,
            HireDate = request.HireDate.ToUniversalTime(),
            Salary = request.Salary
        };

        _dbContext.Staffs.Add(staff);
        await _dbContext.SaveChangesAsync();

        return ToDto(staff, user);
    }

    public async Task<StaffDto?> UpdateRoleAsync(int staffId, UpdateStaffRoleDto request)
    {
        var staff = await _dbContext.Staffs
            .Include(x => x.User)
            .FirstOrDefaultAsync(x => x.StaffId == staffId);

        if (staff is null)
            return null;

        staff.User.Role = request.Role;
        await _dbContext.SaveChangesAsync();

        return ToDto(staff, staff.User);
    }

    public async Task<StaffDto?> UpdateAsync(int staffId, UpdateStaffDto request)
    {
        var staff = await _dbContext.Staffs
            .Include(x => x.User)
            .FirstOrDefaultAsync(x => x.StaffId == staffId);

        if (staff is null)
            return null;

        var userId = staff.UserId;

        if (await _dbContext.Users.AnyAsync(x => x.Email == request.Email && x.UserId != userId))
            throw new InvalidOperationException("Email is already in use.");

        if (await _dbContext.Users.AnyAsync(x => x.PhoneNumber == request.PhoneNumber && x.UserId != userId))
            throw new InvalidOperationException("Phone number is already in use.");

        if (await _dbContext.Staffs.AnyAsync(x => x.EmployeeCode == request.EmployeeCode && x.StaffId != staffId))
            throw new InvalidOperationException("Employee code already exists.");

        staff.User.FullName = request.FullName;
        staff.User.Email = request.Email;
        staff.User.PhoneNumber = request.PhoneNumber;
        staff.User.Role = request.Role;
        staff.User.IsActive = request.IsActive;

        staff.EmployeeCode = request.EmployeeCode;
        staff.JobTitle = request.JobTitle;
        staff.HireDate = request.HireDate.ToUniversalTime();
        staff.Salary = request.Salary;

        await _dbContext.SaveChangesAsync();

        return ToDto(staff, staff.User);
    }

    public async Task<IReadOnlyList<StaffDto>> GetAllAsync()
    {
        return await _dbContext.Staffs
            .AsNoTracking()
            .Include(x => x.User)
            .Where(x => x.User.IsActive)
            .OrderBy(x => x.User.FullName)
            .Select(x => new StaffDto
            {
                StaffId = x.StaffId,
                UserId = x.UserId,
                FullName = x.User.FullName,
                Email = x.User.Email,
                PhoneNumber = x.User.PhoneNumber,
                Role = x.User.Role.ToString(),
                EmployeeCode = x.EmployeeCode,
                JobTitle = x.JobTitle,
                HireDate = x.HireDate,
                Salary = x.Salary,
                IsActive = x.User.IsActive
            })
            .ToListAsync();
    }

    public async Task<bool> DeleteAsync(int staffId)
    {
        var staff = await _dbContext.Staffs
            .Include(x => x.User)
            .FirstOrDefaultAsync(x => x.StaffId == staffId);

        if (staff is null)
            return false;

        // Soft-delete to preserve relational history and avoid FK delete conflicts.
        if (!staff.User.IsActive)
            return true;

        staff.User.IsActive = false;
        await _dbContext.SaveChangesAsync();
        return true;
    }

    private static StaffDto ToDto(Staff staff, User user) => new()
    {
        StaffId = staff.StaffId,
        UserId = staff.UserId,
        FullName = user.FullName,
        Email = user.Email,
        PhoneNumber = user.PhoneNumber,
        Role = user.Role.ToString(),
        EmployeeCode = staff.EmployeeCode,
        JobTitle = staff.JobTitle,
        HireDate = staff.HireDate,
        Salary = staff.Salary,
        IsActive = user.IsActive
    };
}
