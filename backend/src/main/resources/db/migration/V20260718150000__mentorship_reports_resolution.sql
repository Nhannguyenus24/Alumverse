
ALTER TABLE mentorship_reports
    ADD COLUMN IF NOT EXISTS resolved_by     integer REFERENCES users (id),
    ADD COLUMN IF NOT EXISTS resolved_at     timestamp,
    ADD COLUMN IF NOT EXISTS resolution_note text,
    ADD COLUMN IF NOT EXISTS action_taken    text;

CREATE INDEX IF NOT EXISTS idx_mentorship_reports_status
    ON mentorship_reports (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_mentorship_reports_reported_member
    ON mentorship_reports (reported_member_id);
