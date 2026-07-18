-- created_at is the stable article creation date; updated_at changes when an
-- article is edited, published, or hidden. published_at duplicated that state.

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'news'
          AND column_name = 'published_at'
    ) THEN
        UPDATE public.news
        SET created_at = COALESCE(created_at, published_at, CURRENT_TIMESTAMP),
            updated_at = COALESCE(updated_at, created_at, published_at, CURRENT_TIMESTAMP);

        ALTER TABLE public.news
            DROP COLUMN published_at;
    END IF;

    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'alumni_posts'
          AND column_name = 'published_at'
    ) THEN
        UPDATE public.alumni_posts
        SET created_at = COALESCE(created_at, published_at, CURRENT_TIMESTAMP),
            updated_at = COALESCE(updated_at, created_at, published_at, CURRENT_TIMESTAMP);

        ALTER TABLE public.alumni_posts
            DROP COLUMN published_at;
    END IF;
END $$;
