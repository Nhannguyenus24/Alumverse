-- Funds: thêm tài liệu đính kèm của quỹ (fund_document_url) — VD quyết định thành lập
-- dạng PDF/DOC/DOCX. ADMIN thêm khi tạo / sửa; người xem tải ở trang chi tiết (read-only).
-- Idempotent — safe to run on local and cloud. Matches docs/postgre.sql.

-- Cột nullable (tùy chọn) → an toàn với các quỹ cũ, không cần backfill.
ALTER TABLE funds ADD COLUMN IF NOT EXISTS fund_document_url text;
