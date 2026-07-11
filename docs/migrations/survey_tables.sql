-- =============================================================================
-- Survey feature schema (run manually — this project has NO migration tool).
-- PostgreSQL. Safe to re-run (IF NOT EXISTS).
-- =============================================================================

-- 1) Form khảo sát (gộp info + cấu trúc câu hỏi trong questions_data JSONB)
CREATE TABLE IF NOT EXISTS survey_forms (
    id                BIGSERIAL PRIMARY KEY,
    organization_id   BIGINT NOT NULL,
    creator_member_id BIGINT,
    title             VARCHAR(255) NOT NULL,
    description       TEXT,
    questions_data    JSONB NOT NULL DEFAULT '[]'::jsonb,
    start_at          TIMESTAMP NOT NULL,
    duration_minutes  INTEGER NOT NULL,
    status            VARCHAR(30) NOT NULL DEFAULT 'DRAFT',   -- DRAFT | OPEN | CLOSED
    allow_multiple    BOOLEAN NOT NULL DEFAULT FALSE,
    created_at        TIMESTAMP NOT NULL DEFAULT now(),
    updated_at        TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_survey_forms_org    ON survey_forms(organization_id);
CREATE INDEX IF NOT EXISTS idx_survey_forms_status ON survey_forms(status);

-- 2) Câu trả lời của người dùng (answers_data JSONB: { questionId: value | [values] })
CREATE TABLE IF NOT EXISTS survey_submissions (
    id           BIGSERIAL PRIMARY KEY,
    form_id      BIGINT NOT NULL REFERENCES survey_forms(id) ON DELETE CASCADE,
    member_id    BIGINT,
    answers_data JSONB NOT NULL,
    submitted_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_survey_submissions_form   ON survey_submissions(form_id);
CREATE INDEX IF NOT EXISTS idx_survey_submissions_member ON survey_submissions(form_id, member_id);

-- =============================================================================
-- Dữ liệu mẫu (tùy chọn) — thay organization_id cho khớp tổ chức của bạn.
-- =============================================================================
-- INSERT INTO survey_forms (organization_id, title, description, questions_data, start_at, duration_minutes, status, allow_multiple)
-- VALUES (
--   1,
--   'Khảo sát nhân sự 2026',
--   'Đánh giá mức độ hài lòng về môi trường làm việc',
--   '[
--       {"id":"q_name","text":"Họ và tên của bạn","type":"SHORT_TEXT","is_required":true},
--       {"id":"q_dept","text":"Phòng ban hiện tại của bạn","type":"SINGLE_CHOICE","is_required":true,
--        "options":[{"id":"opt_it","text":"IT - Công nghệ thông tin"},{"id":"opt_hr","text":"HR - Nhân sự"}]},
--       {"id":"q_benefit","text":"Bạn thích phúc lợi nào nhất?","type":"MULTI_CHOICE","is_required":false,
--        "options":[{"id":"opt_gym","text":"Thẻ tập Gym"},{"id":"opt_remote","text":"Làm việc từ xa"}]},
--       {"id":"q_score","text":"Mức độ hài lòng (1-5)","type":"RATING","is_required":true},
--       {"id":"q_start","text":"Ngày bắt đầu làm việc","type":"DATE","is_required":false}
--   ]'::jsonb,
--   now(), 1440, 'OPEN', false
-- );
