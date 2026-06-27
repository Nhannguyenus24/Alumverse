-- Add a moderation/visibility status to forum categories and topics, and drop the
-- legacy is_locked flag on topics.
--   status: 'ACTIVE'   -> visible publicly
--           'INACTIVE' -> hidden (soft-deactivated by admin)
--           'PENDING'  -> awaiting admin approval (default for user-created topics)
-- Run once against existing databases. Idempotent.

ALTER TABLE "forum_categories" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'ACTIVE';
ALTER TABLE "forum_topics"     ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'ACTIVE';

-- Backfill any pre-existing rows so nothing is accidentally hidden.
UPDATE "forum_categories" SET "status" = 'ACTIVE' WHERE "status" IS NULL;
UPDATE "forum_topics"     SET "status" = 'ACTIVE' WHERE "status" IS NULL;

-- Drop the obsolete lock flag (replaced by status).
ALTER TABLE "forum_topics" DROP COLUMN IF EXISTS "is_locked";
