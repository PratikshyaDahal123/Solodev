using Backend.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Backend.Data.Configurations;

public class PartConfiguration : IEntityTypeConfiguration<Part>
{
    public void Configure(EntityTypeBuilder<Part> builder)
    {
        builder.HasKey(x => x.PartId);

        builder.Property(x => x.PartCode).IsRequired().HasMaxLength(50);
        builder.Property(x => x.PartName).IsRequired().HasMaxLength(150);
        builder.Property(x => x.Description).HasMaxLength(500);
        builder.Property(x => x.UnitPrice).HasPrecision(18, 2);
        builder.Property(x => x.ReorderLevel).HasDefaultValue(10);

        builder.HasIndex(x => x.PartCode).IsUnique();

        builder.HasOne(x => x.Vendor)
            .WithMany(x => x.Parts)
            .HasForeignKey(x => x.VendorId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.Category)
            .WithMany(x => x.Parts)
            .HasForeignKey(x => x.CategoryId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(x => x.PurchaseInvoiceItems)
            .WithOne(x => x.Part)
            .HasForeignKey(x => x.PartId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(x => x.SalesInvoiceItems)
            .WithOne(x => x.Part)
            .HasForeignKey(x => x.PartId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
