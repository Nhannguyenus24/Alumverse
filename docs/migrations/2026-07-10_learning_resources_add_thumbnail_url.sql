-- Learning resources: thêm thumbnail_url để hiển thị ảnh minh hoạ trong danh sách/trang chi tiết,
-- đồng bộ với cách news/alumni_posts đã làm. Người dùng nhập URL hoặc upload ảnh (backend convert sang URL).
-- Idempotent — safe to run on local and cloud. Matches docs/postgre.sql.

-- Cột nullable (tùy chọn) → an toàn với các resource cũ, không cần backfill.
ALTER TABLE learning_resources ADD COLUMN IF NOT EXISTS thumbnail_url text;
