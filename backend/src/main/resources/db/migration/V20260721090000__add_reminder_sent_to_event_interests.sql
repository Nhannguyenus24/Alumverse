ALTER TABLE event_interests ADD COLUMN IF NOT EXISTS reminder_sent boolean NOT NULL DEFAULT false;
