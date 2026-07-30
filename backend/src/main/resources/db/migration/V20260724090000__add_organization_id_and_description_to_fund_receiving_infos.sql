ALTER TABLE public.fund_receiving_infos
    ADD COLUMN IF NOT EXISTS organization_id integer,
    ADD COLUMN IF NOT EXISTS description text;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_fund_receiving_infos_organization'
    ) THEN
        ALTER TABLE public.fund_receiving_infos
            ADD CONSTRAINT fk_fund_receiving_infos_organization
            FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
            ON DELETE SET NULL;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_fund_receiving_infos_organization_id
    ON public.fund_receiving_infos(organization_id);
