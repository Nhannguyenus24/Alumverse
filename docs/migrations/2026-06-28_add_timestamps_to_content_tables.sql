-- Thêm cột thời gian created_at/updated_at cho các bảng nội dung:
-- organizations, events, news, alumni_posts, achievements, jobs, learning_resources
-- Idempotent — safe to run on local and cloud. Matches docs/postgre.sql.
-- Auditing qua @CreatedDate/@LastModifiedDate (@EnableR2dbcAuditing đã bật).

-- organizations (đã có created_at, chỉ thêm updated_at)
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS created_at timestamp DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS updated_at timestamp DEFAULT CURRENT_TIMESTAMP;

-- events
ALTER TABLE events ADD COLUMN IF NOT EXISTS created_at timestamp DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE events ADD COLUMN IF NOT EXISTS updated_at timestamp DEFAULT CURRENT_TIMESTAMP;

-- news
ALTER TABLE news ADD COLUMN IF NOT EXISTS created_at timestamp DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE news ADD COLUMN IF NOT EXISTS updated_at timestamp DEFAULT CURRENT_TIMESTAMP;

-- alumni_posts
ALTER TABLE alumni_posts ADD COLUMN IF NOT EXISTS created_at timestamp DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE alumni_posts ADD COLUMN IF NOT EXISTS updated_at timestamp DEFAULT CURRENT_TIMESTAMP;

-- achievements
ALTER TABLE achievements ADD COLUMN IF NOT EXISTS created_at timestamp DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE achievements ADD COLUMN IF NOT EXISTS updated_at timestamp DEFAULT CURRENT_TIMESTAMP;

-- jobs
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS created_at timestamp DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS updated_at timestamp DEFAULT CURRENT_TIMESTAMP;

-- learning_resources
ALTER TABLE learning_resources ADD COLUMN IF NOT EXISTS created_at timestamp DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE learning_resources ADD COLUMN IF NOT EXISTS updated_at timestamp DEFAULT CURRENT_TIMESTAMP;

-- Backfill cho dòng cũ (đảm bảo không NULL)
UPDATE organizations     SET created_at = COALESCE(created_at, CURRENT_TIMESTAMP), updated_at = COALESCE(updated_at, CURRENT_TIMESTAMP);
UPDATE events            SET created_at = COALESCE(created_at, CURRENT_TIMESTAMP), updated_at = COALESCE(updated_at, CURRENT_TIMESTAMP);
UPDATE news              SET created_at = COALESCE(created_at, published_at, CURRENT_TIMESTAMP), updated_at = COALESCE(updated_at, published_at, CURRENT_TIMESTAMP);
UPDATE alumni_posts      SET created_at = COALESCE(created_at, published_at, CURRENT_TIMESTAMP), updated_at = COALESCE(updated_at, published_at, CURRENT_TIMESTAMP);
UPDATE achievements      SET created_at = COALESCE(created_at, CURRENT_TIMESTAMP), updated_at = COALESCE(updated_at, CURRENT_TIMESTAMP);
UPDATE jobs              SET created_at = COALESCE(created_at, CURRENT_TIMESTAMP), updated_at = COALESCE(updated_at, CURRENT_TIMESTAMP);
UPDATE learning_resources SET created_at = COALESCE(created_at, CURRENT_TIMESTAMP), updated_at = COALESCE(updated_at, CURRENT_TIMESTAMP);
