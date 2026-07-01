-- Add requires_check_in flag to events table.
-- Events with this flag set to true show the QR scanner button for staff.
ALTER TABLE events ADD COLUMN IF NOT EXISTS requires_check_in BOOLEAN NOT NULL DEFAULT FALSE;
