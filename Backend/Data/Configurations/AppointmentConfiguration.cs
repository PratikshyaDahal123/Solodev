using Backend.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Backend.Data.Configurations;

public class AppointmentConfiguration : IEntityTypeConfiguration<Appointment>
{
    public void Configure(EntityTypeBuilder<Appointment> builder)
    {
        builder.HasKey(x => x.AppointmentId);

        builder.Property(x => x.ServiceType).IsRequired().HasMaxLength(100);
        builder.Property(x => x.Description).HasMaxLength(500);
        builder.Property(x => x.AdminNotes).HasMaxLength(500);
        builder.Property(x => x.Status).HasConversion<int>();
        builder.Property(x => x.CreatedAt).HasDefaultValueSql("NOW()");

        builder.HasOne(x => x.Customer)
            .WithMany(x => x.Appointments)
            .HasForeignKey(x => x.CustomerId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.Vehicle)
            .WithMany(x => x.Appointments)
            .HasForeignKey(x => x.VehicleId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
