using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Migrations
{
    /// <inheritdoc />
    public partial class BackfillStockQuantityFromInvoices : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                UPDATE ""Parts"" p
                SET ""StockQuantity"" = GREATEST(
                    COALESCE((SELECT SUM(pi.""Quantity"") FROM ""PurchaseInvoiceItems"" pi WHERE pi.""PartId"" = p.""PartId""), 0)
                    - COALESCE((SELECT SUM(si.""Quantity"") FROM ""SalesInvoiceItems"" si WHERE si.""PartId"" = p.""PartId""), 0),
                    0
                );
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("UPDATE \"Parts\" SET \"StockQuantity\" = 0;");
        }
    }
}
