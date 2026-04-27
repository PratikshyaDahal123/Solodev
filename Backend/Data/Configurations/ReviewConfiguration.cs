using Backend.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Backend.Data.Configurations;

public class ReviewConfiguration : IEntityTypeConfiguration<Review>
{
    public void Configure(EntityTypeBuilder<Review> builder)
    {
        builder.HasKey(x => x.ReviewId);
        builder.HasIndex(x => x.AppointmentId).IsUnique();

        builder.Property(x => x.Comment).HasMaxLength(1000);
        builder.Property(x => x.CreatedAt).HasDefaultValueSql("NOW()");

        builder.HasOne(x => x.Customer)
            .WithMany(x => x.Reviews)
            .HasForeignKey(x => x.CustomerId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
