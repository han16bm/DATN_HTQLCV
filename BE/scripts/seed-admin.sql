-- Tạo 1 đơn vị và 1 tài khoản ADMIN đầu tiên trên một DB rỗng (vừa chạy migration xong).
-- Không có cách tạo tài khoản nào khác khi DB trống: UsersController.Create yêu cầu [Authorize],
-- nên cần tài khoản ADMIN này để đăng nhập lần đầu rồi tạo các tài khoản khác qua API.
--
-- Cách chạy (sau khi `dotnet ef database update` đã tạo xong bảng):
--   docker exec -i datn-postgres psql -U datn -d datn < BE/scripts/seed-admin.sql
--
-- Đăng nhập: username "admin", password "Admin@123456" — đổi mật khẩu ngay sau khi đăng nhập lần đầu
-- (hash dưới đây là PBKDF2 thật của ASP.NET Core Identity cho đúng mật khẩu này, sinh bằng PasswordHasher<User>,
-- không phải placeholder — không tự chế hash khác bằng tay, sẽ không khớp thuật toán xác thực).
DO $$
DECLARE
  unit_id text := md5(random()::text || clock_timestamp()::text);
  admin_id text := md5(random()::text || clock_timestamp()::text);
  now_ts timestamp := now();
BEGIN
  INSERT INTO "Units" ("Id", "Version", "CreatedAt", "UpdatedAt", "Name", "ParentId", "ManagerId", "Status")
  VALUES (unit_id, 1, now_ts, now_ts, 'Phong CNTT', NULL, NULL, 'Active');

  INSERT INTO "Users" ("Id", "Version", "CreatedAt", "UpdatedAt", "Username", "DisplayName", "Email",
                        "PasswordHash", "UnitId", "SystemRole", "Status", "LockedAt", "LockReason", "FailedLoginCount")
  VALUES (admin_id, 1, now_ts, now_ts, 'admin', 'Quan tri vien', 'admin@datn.local',
          'AQAAAAIAAYagAAAAEC+m3cl77l204p5hD+k9MewFamEyvozFjzgZ9EZm6QDdRwfhyaGKgInzEfH2CJH4tg==',
          unit_id, 'Admin', 'Active', NULL, NULL, 0);

  RAISE NOTICE 'Seeded admin user. unitId=%, userId=%', unit_id, admin_id;
END $$;
