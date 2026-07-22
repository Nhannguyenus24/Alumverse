CREATE INDEX IF NOT EXISTS idx_events_org_start_published ON events (organization_id, is_published, start_time);
CREATE INDEX IF NOT EXISTS idx_events_start_published ON events (is_published, start_time);
CREATE INDEX IF NOT EXISTS idx_events_org_end_published ON events (organization_id, is_published, end_time DESC);
CREATE INDEX IF NOT EXISTS idx_events_end_published ON events (is_published, end_time DESC);
CREATE INDEX IF NOT EXISTS idx_events_interested_count_created_at ON events (interested_count DESC, created_at DESC);
