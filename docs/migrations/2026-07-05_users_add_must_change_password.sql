-- 2026-07-05: Force password change on first login for admin-provisioned accounts
--
-- Mục tiêu:
--   Thêm cột must_change_password để đánh dấu các tài khoản được admin tạo
--   trực tiếp (organization member, admin) cần đổi mật khẩu ở lần đăng nhập đầu.
--   Tài khoản tự đăng ký (self-signup) không bị ảnh hưởng vì mặc định false.

BEGIN;

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "must_change_password" boolean NOT NULL DEFAULT false;

COMMIT;
