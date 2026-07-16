-- Learning resources: add moderation status so academic opportunity posts can
-- follow the same submission/review flow as other article channels.
--   PENDING  -> awaiting admin review
--   APPROVED -> visible/accepted
--   REJECTED -> rejected by admin
-- Existing rows are backfilled as APPROVED to preserve current public content.
-- Idempotent: safe to run multiple times on local and cloud databases.

ALTER TABLE learning_resources
    ADD COLUMN IF NOT EXISTS status text DEFAULT 'APPROVED';

UPDATE learning_resources
SET status = 'APPROVED'
WHERE status IS NULL;

ALTER TABLE learning_resources
    ALTER COLUMN status SET DEFAULT 'APPROVED',
    ALTER COLUMN status SET NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'learning_resources_status_check'
    ) THEN
        ALTER TABLE learning_resources
            ADD CONSTRAINT learning_resources_status_check
            CHECK (status = ANY (ARRAY[
                'PENDING'::text,
                'APPROVED'::text,
                'REJECTED'::text
            ]));
    END IF;
END $$;
