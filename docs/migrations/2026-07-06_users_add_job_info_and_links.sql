ALTER TABLE users ADD COLUMN IF NOT EXISTS current_job_title text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS current_company text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS links json;
