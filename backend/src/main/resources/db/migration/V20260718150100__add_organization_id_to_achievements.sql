-- Scope achievements by organization like the other article channels.

ALTER TABLE public.achievements
    ADD COLUMN IF NOT EXISTS organization_id integer;

UPDATE public.achievements a
SET organization_id = inferred.organization_id
FROM (
    SELECT DISTINCT ON (om.user_id)
        om.user_id,
        om.organization_id
    FROM public.organization_members om
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
        ALTER TABLE public.achievements
            ADD CONSTRAINT fk_achievements_organization
            FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
            ON DELETE SET NULL;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_achievements_organization_id
    ON public.achievements(organization_id);
