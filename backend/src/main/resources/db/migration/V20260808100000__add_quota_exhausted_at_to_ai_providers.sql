ALTER TABLE ai_providers
    ADD COLUMN IF NOT EXISTS quota_exhausted_at timestamp NULL;
