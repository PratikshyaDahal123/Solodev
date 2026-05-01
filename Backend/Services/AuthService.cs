using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Backend.Data;
using Backend.DTOs.Auth;
using Backend.Enums;
using Backend.Models;
using Backend.Services.Interfaces;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace Backend.Services;

public class AuthService : IAuthService
{
    private readonly AppDbContext _dbContext;
    private readonly IConfiguration _configuration;
    private readonly IPasswordHasher<User> _passwordHasher;

    public AuthService(AppDbContext dbContext, IConfiguration configuration, IPasswordHasher<User> passwordHasher)
    {
        _dbContext = dbContext;
        _configuration = configuration;
        _passwordHasher = passwordHasher;
    }

    public async Task<AuthResponseDto> RegisterAsync(RegisterDto request)
    {
        var emailExists = await _dbContext.Users.AnyAsync(x => x.Email == request.Email);
        if (emailExists)
        {
            throw new InvalidOperationException("Email is already in use.");
        }

        var phoneExists = await _dbContext.Users.AnyAsync(x => x.PhoneNumber == request.PhoneNumber);
        if (phoneExists)
        {
            throw new InvalidOperationException("Phone number is already in use.");
        }

        var user = new User
        {
            FullName = request.FullName,
            Email = request.Email,
            PhoneNumber = request.PhoneNumber,
            Role = UserRole.Customer,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        user.PasswordHash = _passwordHasher.HashPassword(user, request.Password);

        _dbContext.Users.Add(user);
        await _dbContext.SaveChangesAsync();

        var customer = new Customer
        {
            UserId = user.UserId,
            CustomerCode = $"CUST-{DateTime.UtcNow:yyyyMMddHHmmssfff}",
            DateJoined = DateTime.UtcNow,
            CreditBalance = 0,
            TotalSpent = 0,
            LoyaltyPoints = 0
        };

        _dbContext.Customers.Add(customer);
        await _dbContext.SaveChangesAsync();

        return CreateAuthResponse(user, customer.CustomerId);
    }

    public async Task<AuthResponseDto?> LoginAsync(LoginDto request)
    {
        var user = await _dbContext.Users.FirstOrDefaultAsync(x => x.Email == request.Email);
        if (user is null || !user.IsActive)
        {
            return null;
        }

        var verification = _passwordHasher.VerifyHashedPassword(user, user.PasswordHash, request.Password);
        if (verification == PasswordVerificationResult.Failed)
        {
            return null;
        }

        var customerId = await _dbContext.Customers
            .AsNoTracking()
            .Where(x => x.UserId == user.UserId)
            .Select(x => (int?)x.CustomerId)
            .FirstOrDefaultAsync();

        var staffId = await _dbContext.Staffs
            .AsNoTracking()
            .Where(x => x.UserId == user.UserId)
            .Select(x => (int?)x.StaffId)
            .FirstOrDefaultAsync();

        return CreateAuthResponse(user, customerId, staffId);
    }

    private AuthResponseDto CreateAuthResponse(User user, int? customerId = null, int? staffId = null)
    {
        var key = _configuration["Jwt:Key"] ?? throw new InvalidOperationException("JWT key is missing.");
        var issuer = _configuration["Jwt:Issuer"] ?? "Backend";
        var audience = _configuration["Jwt:Audience"] ?? "BackendClients";
        var expiresAt = DateTime.UtcNow.AddHours(2);

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.UserId.ToString()),
            new(ClaimTypes.Name, user.FullName),
            new(ClaimTypes.Email, user.Email),
            new(ClaimTypes.Role, user.Role.ToString())
        };

        var credentials = new SigningCredentials(
            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key)),
            SecurityAlgorithms.HmacSha256);

        var tokenDescriptor = new JwtSecurityToken(
            issuer,
            audience,
            claims,
            expires: expiresAt,
            signingCredentials: credentials);

        var token = new JwtSecurityTokenHandler().WriteToken(tokenDescriptor);

        return new AuthResponseDto
        {
            Token = token,
            ExpiresAt = expiresAt,
            UserId = user.UserId,
            CustomerId = customerId,
            StaffId = staffId,
            FullName = user.FullName,
            Email = user.Email,
            Role = user.Role.ToString()
        };
    }
}
