-- Funds: thêm người liên hệ (manager_email) + cột thời gian created_at/updated_at
-- Idempotent — safe to run on local and cloud. Matches docs/postgre.sql.

-- 1) Timestamps (auditing qua @CreatedDate/@LastModifiedDate, @EnableR2dbcAuditing đã bật)
ALTER TABLE funds ADD COLUMN IF NOT EXISTS created_at timestamp DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE funds ADD COLUMN IF NOT EXISTS updated_at timestamp DEFAULT CURRENT_TIMESTAMP;

-- Backfill cho dòng cũ (đảm bảo không NULL)
UPDATE funds SET created_at = COALESCE(created_at, CURRENT_TIMESTAMP),
                 updated_at = COALESCE(updated_at, CURRENT_TIMESTAMP);

-- 2) Người liên hệ / phụ trách quỹ
-- Thêm cột trước (nullable) để backfill được, sau đó mới SET NOT NULL.
ALTER TABLE funds ADD COLUMN IF NOT EXISTS manager_email text;

-- Backfill BẮT BUỘC trước khi set NOT NULL.
-- LƯU Ý: placeholder rỗng '' chỉ hợp lý cho dữ liệu dev. Nếu chạy trên môi trường
-- có quỹ thật, hãy thay bằng email phụ trách thực tế trước khi chạy SET NOT NULL,
-- nếu không các quỹ cũ sẽ mang email rỗng.
UPDATE funds SET manager_email = '' WHERE manager_email IS NULL;

ALTER TABLE funds ALTER COLUMN manager_email SET NOT NULL;
