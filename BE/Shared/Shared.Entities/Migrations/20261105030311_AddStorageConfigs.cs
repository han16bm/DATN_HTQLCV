using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Shared.Entities.Migrations
{
    /// <inheritdoc />
    public partial class AddStorageConfigs : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "SystemConfigs",
                columns: new[] { "Id", "CreatedAt", "CreatedBy", "DataType", "Description", "Group", "IsActive", "Key", "Name", "ServiceType", "UpdatedAt", "UpdatedBy", "Value", "Version" },
                values: new object[,]
                {
                    { "cfg-008", new DateTime(2026, 11, 3, 0, 0, 0, 0, DateTimeKind.Utc), null, "STRING", "Auto: Cloudinary khi đã nhập đủ thông tin Cloudinary, ngược lại lưu đĩa cục bộ của service. Local: luôn lưu cục bộ.", "STORAGE", true, "Storage:Provider", "Nơi lưu tệp", "Global", new DateTime(2026, 11, 3, 0, 0, 0, 0, DateTimeKind.Utc), null, "Auto", 1 },
                    { "cfg-009", new DateTime(2026, 11, 3, 0, 0, 0, 0, DateTimeKind.Utc), null, "STRING", "Dùng dựng link ảnh đại diện khi lưu cục bộ (FE và gateway khác origin), ví dụ https://api.congty.vn.", "STORAGE", true, "Storage:PublicBaseUrl", "Địa chỉ công khai của gateway", "Global", new DateTime(2026, 11, 3, 0, 0, 0, 0, DateTimeKind.Utc), null, "http://localhost:5000", 1 },
                    { "cfg-010", new DateTime(2026, 11, 3, 0, 0, 0, 0, DateTimeKind.Utc), null, "STRING", "Product environment (cloud name) trên trang Cloudinary > Settings > API Keys.", "STORAGE", true, "Storage:Cloudinary:CloudName", "Cloudinary - Cloud name", "Global", new DateTime(2026, 11, 3, 0, 0, 0, 0, DateTimeKind.Utc), null, "", 1 },
                    { "cfg-011", new DateTime(2026, 11, 3, 0, 0, 0, 0, DateTimeKind.Utc), null, "STRING", "API key của Cloudinary (định danh công khai, đi kèm API secret).", "STORAGE", true, "Storage:Cloudinary:ApiKey", "Cloudinary - API key", "Global", new DateTime(2026, 11, 3, 0, 0, 0, 0, DateTimeKind.Utc), null, "", 1 },
                    { "cfg-012", new DateTime(2026, 11, 3, 0, 0, 0, 0, DateTimeKind.Utc), null, "STRING", "Bí mật ký yêu cầu Cloudinary. Lưu mã hoá, không hiển thị lại; để trống khi sửa nghĩa là giữ giá trị cũ.", "STORAGE", true, "Storage:Cloudinary:ApiSecret", "Cloudinary - API secret", "Global", new DateTime(2026, 11, 3, 0, 0, 0, 0, DateTimeKind.Utc), null, "", 1 },
                    { "cfg-013", new DateTime(2026, 11, 3, 0, 0, 0, 0, DateTimeKind.Utc), null, "STRING", "Thư mục gốc trên Cloudinary, ví dụ datn → datn/avatars, datn/evidence.", "STORAGE", true, "Storage:Cloudinary:Folder", "Cloudinary - Thư mục gốc", "Global", new DateTime(2026, 11, 3, 0, 0, 0, 0, DateTimeKind.Utc), null, "datn", 1 }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "SystemConfigs",
                keyColumn: "Id",
                keyValue: "cfg-008");

            migrationBuilder.DeleteData(
                table: "SystemConfigs",
                keyColumn: "Id",
                keyValue: "cfg-009");

            migrationBuilder.DeleteData(
                table: "SystemConfigs",
                keyColumn: "Id",
                keyValue: "cfg-010");

            migrationBuilder.DeleteData(
                table: "SystemConfigs",
                keyColumn: "Id",
                keyValue: "cfg-011");

            migrationBuilder.DeleteData(
                table: "SystemConfigs",
                keyColumn: "Id",
                keyValue: "cfg-012");

            migrationBuilder.DeleteData(
                table: "SystemConfigs",
                keyColumn: "Id",
                keyValue: "cfg-013");
        }
    }
}
