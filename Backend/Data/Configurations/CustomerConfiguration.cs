using Backend.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Backend.Data.Configurations;

public class CustomerConfiguration : IEntityTypeConfiguration<Customer>
{
    public void Configure(EntityTypeBuilder<Customer> builder)
    {
        builder.HasKey(x => x.CustomerId);

        builder.Property(x => x.CustomerCode).IsRequired().HasMaxLength(50);
        builder.Property(x => x.Address).HasMaxLength(250);
        builder.Property(x => x.CreditBalance).HasPrecision(18, 2);
        builder.Property(x => x.TotalSpent).HasPrecision(18, 2);

        builder.HasIndex(x => x.CustomerCode).IsUnique();

        builder.HasOne(x => x.User)
            .WithOne(x => x.CustomerProfile)
            .HasForeignKey<Customer>(x => x.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(x => x.Vehicles)
            .WithOne(x => x.Customer)
            .HasForeignKey(x => x.CustomerId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(x => x.SalesInvoices)
            .WithOne(x => x.Customer)
            .HasForeignKey(x => x.CustomerId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(x => x.Appointments)
            .WithOne(x => x.Customer)
            .HasForeignKey(x => x.CustomerId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(x => x.Reviews)
            .WithOne(x => x.Customer)
            .HasForeignKey(x => x.CustomerId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
