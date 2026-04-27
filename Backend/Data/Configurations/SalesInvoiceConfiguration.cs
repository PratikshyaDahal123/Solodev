using Backend.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Backend.Data.Configurations;

public class SalesInvoiceConfiguration : IEntityTypeConfiguration<SalesInvoice>
{
    public void Configure(EntityTypeBuilder<SalesInvoice> builder)
    {
        builder.HasKey(x => x.SalesInvoiceId);

        builder.Property(x => x.InvoiceNumber).IsRequired().HasMaxLength(50);
        builder.Property(x => x.Notes).HasMaxLength(500);
        builder.Property(x => x.Subtotal).HasPrecision(18, 2);
        builder.Property(x => x.DiscountAmount).HasPrecision(18, 2);
        builder.Property(x => x.TotalAmount).HasPrecision(18, 2);
        builder.Property(x => x.AmountPaid).HasPrecision(18, 2);
        builder.Property(x => x.BalanceAmount).HasPrecision(18, 2);
        builder.Property(x => x.Status).HasConversion<int>();

        builder.HasIndex(x => x.InvoiceNumber).IsUnique();

        builder.HasOne(x => x.Customer)
            .WithMany(x => x.SalesInvoices)
            .HasForeignKey(x => x.CustomerId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.Vehicle)
            .WithMany(x => x.SalesInvoices)
            .HasForeignKey(x => x.VehicleId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(x => x.Staff)
            .WithMany(x => x.SalesInvoices)
            .HasForeignKey(x => x.StaffId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasMany(x => x.Items)
            .WithOne(x => x.SalesInvoice)
            .HasForeignKey(x => x.SalesInvoiceId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
