-- Bổ sung context của request vào admin_audit_logs để biết CHÍNH XÁC từng
-- admin account đã thao tác gì trên dashboard admin: gọi API nào (method + path),
-- từ IP/thiết bị nào, kết quả ra sao (status code + SUCCESS/FAILURE) và mất bao lâu.
--
-- Cột cũ (action, resource_type, resource_id, before/after/metadata) vẫn giữ nguyên
-- cho các bản ghi "ngữ nghĩa" ghi tay từ service (ban, xoá, kiểm duyệt...).
-- Cột mới phục vụ cho lớp auto-capture qua WebFilter (mọi request mutating /api/admin/**).
--
-- Idempotent — an toàn khi chạy nhiều lần trên local và cloud.

ALTER TABLE admin_audit_logs
    ADD COLUMN IF NOT EXISTS http_method  text,
    ADD COLUMN IF NOT EXISTS request_path text,
    ADD COLUMN IF NOT EXISTS ip_address   text,
    ADD COLUMN IF NOT EXISTS user_agent   text,
    ADD COLUMN IF NOT EXISTS status_code  integer,
    ADD COLUMN IF NOT EXISTS latency_ms   bigint,
    ADD COLUMN IF NOT EXISTS status       text,
    ADD COLUMN IF NOT EXISTS admin_role   text;

-- Truy vấn chính của trang audit là: lọc theo admin + sắp theo thời gian giảm dần.
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_admin_user
    ON admin_audit_logs (admin_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created_at
    ON admin_audit_logs (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_action
    ON admin_audit_logs (action);

CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_resource_type
    ON admin_audit_logs (resource_type);
