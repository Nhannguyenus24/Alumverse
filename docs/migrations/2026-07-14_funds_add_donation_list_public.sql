-- Add donation_list_public flag to funds table.
-- When true, the fund's donation list is shown on the public fund detail page;
-- when false (default), only the internal admin donations dialog can see it.
ALTER TABLE funds ADD COLUMN IF NOT EXISTS donation_list_public BOOLEAN NOT NULL DEFAULT FALSE;
