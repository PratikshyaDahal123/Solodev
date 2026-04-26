using Backend.Enums;
using Backend.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Backend.Data;

public static class AdminSeeder
{
    public static async Task SeedAsync(IServiceProvider services, IConfiguration configuration)
    {
        using var scope = services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var passwordHasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher<User>>();

        if (await dbContext.Users.AnyAsync(x => x.Role == UserRole.Admin))
        {
            return;
        }

        var email = configuration["AdminSeed:Email"] ?? "admin@backend.local";
        var fullName = configuration["AdminSeed:FullName"] ?? "System Admin";
        var phone = configuration["AdminSeed:PhoneNumber"] ?? "9800000000";
        var password = configuration["AdminSeed:Password"] ?? "Admin@12345";

        if (await dbContext.Users.AnyAsync(x => x.Email == email || x.PhoneNumber == phone))
        {
            return;
        }

        var admin = new User
        {
            FullName = fullName,
            Email = email,
            PhoneNumber = phone,
            Role = UserRole.Admin,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        admin.PasswordHash = passwordHasher.HashPassword(admin, password);

        dbContext.Users.Add(admin);
        await dbContext.SaveChangesAsync();
    }
}
