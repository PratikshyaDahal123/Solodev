using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Migrations
{
    public partial class EnsurePartCascade : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_PurchaseInvoiceItems_Parts_PartId",
                table: "PurchaseInvoiceItems");

            migrationBuilder.DropForeignKey(
                name: "FK_SalesInvoiceItems_Parts_PartId",
                table: "SalesInvoiceItems");

            migrationBuilder.AddForeignKey(
                name: "FK_PurchaseInvoiceItems_Parts_PartId",
                table: "PurchaseInvoiceItems",
                column: "PartId",
                principalTable: "Parts",
                principalColumn: "PartId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_SalesInvoiceItems_Parts_PartId",
                table: "SalesInvoiceItems",
                column: "PartId",
                principalTable: "Parts",
                principalColumn: "PartId",
                onDelete: ReferentialAction.Cascade);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_PurchaseInvoiceItems_Parts_PartId",
                table: "PurchaseInvoiceItems");

            migrationBuilder.DropForeignKey(
                name: "FK_SalesInvoiceItems_Parts_PartId",
                table: "SalesInvoiceItems");

            migrationBuilder.AddForeignKey(
                name: "FK_PurchaseInvoiceItems_Parts_PartId",
                table: "PurchaseInvoiceItems",
                column: "PartId",
                principalTable: "Parts",
                principalColumn: "PartId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_SalesInvoiceItems_Parts_PartId",
                table: "SalesInvoiceItems",
                column: "PartId",
                principalTable: "Parts",
                principalColumn: "PartId",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
