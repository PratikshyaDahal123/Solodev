using Backend.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Backend.Data.Configurations;

public class PurchaseInvoiceItemConfiguration : IEntityTypeConfiguration<PurchaseInvoiceItem>
{
    public void Configure(EntityTypeBuilder<PurchaseInvoiceItem> builder)
    {
        builder.HasKey(x => x.PurchaseInvoiceItemId);

        builder.Property(x => x.UnitCost).HasPrecision(18, 2);
        builder.Property(x => x.LineTotal).HasPrecision(18, 2);

        builder.HasOne(x => x.PurchaseInvoice)
            .WithMany(x => x.Items)
            .HasForeignKey(x => x.PurchaseInvoiceId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.Part)
            .WithMany(x => x.PurchaseInvoiceItems)
            .HasForeignKey(x => x.PartId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
