using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Migrations
{
    public partial class CreatePartRequestsIfMissing : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
                        var sql = @"
CREATE TABLE IF NOT EXISTS ""PartRequests"" (
    ""PartRequestId"" SERIAL PRIMARY KEY,
    ""CustomerId"" integer NOT NULL,
    ""PartName"" character varying(150) NOT NULL,
    ""RequestedQuantity"" integer NOT NULL,
    ""Notes"" character varying(500),
    ""Status"" integer NOT NULL,
    ""RequestedAt"" timestamp with time zone NOT NULL DEFAULT NOW(),
    CONSTRAINT ""FK_PartRequests_Customers_CustomerId"" FOREIGN KEY (""CustomerId"") REFERENCES ""Customers"" (""CustomerId"") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS ""IX_PartRequests_CustomerId"" ON ""PartRequests"" (""CustomerId"");
";
            migrationBuilder.Sql(sql);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("DROP TABLE IF EXISTS \"PartRequests\";");
        }
    }
}
