using Backend.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Backend.Data.Configurations;

public class StaffConfiguration : IEntityTypeConfiguration<Staff>
{
    public void Configure(EntityTypeBuilder<Staff> builder)
    {
        builder.HasKey(x => x.StaffId);

        builder.Property(x => x.EmployeeCode).IsRequired().HasMaxLength(50);
        builder.Property(x => x.JobTitle).IsRequired().HasMaxLength(100);
        builder.Property(x => x.Salary).HasPrecision(18, 2);

        builder.HasIndex(x => x.EmployeeCode).IsUnique();

        builder.HasOne(x => x.User)
            .WithOne(x => x.StaffProfile)
            .HasForeignKey<Staff>(x => x.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(x => x.PurchaseInvoices)
            .WithOne(x => x.Staff)
            .HasForeignKey(x => x.StaffId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasMany(x => x.SalesInvoices)
            .WithOne(x => x.Staff)
            .HasForeignKey(x => x.StaffId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
