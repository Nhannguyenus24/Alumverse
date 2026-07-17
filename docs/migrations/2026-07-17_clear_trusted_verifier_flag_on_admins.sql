-- Xác thực chéo (peer verification) là việc giữa các thành viên thường với nhau.
-- Admin/staff đã có đường duyệt riêng nên không được đứng tên trong danh sách
-- "người xác thực tin cậy" — findTrustedVerifiersByOrganizationId đã lọc bằng
-- role NOT IN ('ADMIN', 'STAFF'), nhưng vẫn còn vài bản ghi cũ mang cờ
-- is_trusted_verifier = true ở các tài khoản ADMIN. Cờ đó là rác: query bỏ qua
-- nên vô hại về hành vi, nhưng gây nhiễu khi đọc dữ liệu.
--
-- Migration này gỡ cờ cho mọi thành viên là ADMIN/STAFF, đưa dữ liệu về đúng ý nghĩa.
-- Run once against existing databases. Idempotent (chạy lại nhiều lần đều an toàn).

UPDATE "organization_members" om
SET "is_trusted_verifier" = false,
    "updated_at" = CURRENT_TIMESTAMP
FROM "users" u
WHERE om."user_id" = u."id"
  AND om."is_trusted_verifier" = true
  AND u."role" IN ('ADMIN', 'STAFF');
