using Backend.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Backend.Data.Configurations;

public class SalesInvoiceItemConfiguration : IEntityTypeConfiguration<SalesInvoiceItem>
{
    public void Configure(EntityTypeBuilder<SalesInvoiceItem> builder)
    {
        builder.HasKey(x => x.SalesInvoiceItemId);

        builder.Property(x => x.UnitPrice).HasPrecision(18, 2);
        builder.Property(x => x.Discount).HasPrecision(18, 2);
        builder.Property(x => x.LineTotal).HasPrecision(18, 2);

        builder.HasOne(x => x.SalesInvoice)
            .WithMany(x => x.Items)
            .HasForeignKey(x => x.SalesInvoiceId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.Part)
            .WithMany(x => x.SalesInvoiceItems)
            .HasForeignKey(x => x.PartId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
