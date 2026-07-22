-- Add a dedicated thumbnail image column to jobs. Until now the `url` column did double
-- duty (source/apply link and display image); the thumbnail now has its own column while
-- `url` stays as the source/apply link.

ALTER TABLE public.jobs
    ADD COLUMN IF NOT EXISTS thumbnail_url text;
