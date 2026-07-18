-- Achievements: add organization_id so achievement articles are scoped like
-- news, alumni posts, jobs and learning resources.
--
-- Existing rows are backfilled from organization_members through member_id.
-- If a user belongs to multiple organizations, the most recently joined org is
-- used as the best available historical inference. New writes must provide the
-- org from the current organization slug/token.
--
-- Run manually on local/cloud DB. Idempotent.

ALTER TABLE achievements
    ADD COLUMN IF NOT EXISTS organization_id integer;

UPDATE achievements a
SET organization_id = inferred.organization_id
FROM (
    SELECT DISTINCT ON (om.user_id)
        om.user_id,
        om.organization_id
    FROM organization_members om
    ORDER BY om.user_id, om.created_at DESC NULLS LAST, om.organization_id DESC
) inferred
WHERE a.organization_id IS NULL
  AND a.member_id = inferred.user_id;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'fk_achievements_organization'
    ) THEN
        ALTER TABLE achievements
            ADD CONSTRAINT fk_achievements_organization
            FOREIGN KEY (organization_id) REFERENCES organizations(id)
            ON DELETE SET NULL;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_achievements_organization_id
    ON achievements(organization_id);
