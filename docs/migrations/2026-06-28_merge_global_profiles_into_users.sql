-- Merge the global_profiles table into users.
-- global_profiles held one row per user (user_id = users.id) with the
-- columns: full_name, phone, bio, dob, gender, settings, updated_at.
-- These now live directly on users. The profile's updated_at is dropped
-- because users already has its own updated_at.
-- Run once against existing databases. Idempotent.

-- 1. Add the profile columns to users.
ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone     text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio       text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS dob       date;
ALTER TABLE users ADD COLUMN IF NOT EXISTS gender    text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS settings  json;

-- 2. Backfill from global_profiles (only if the old table still exists).
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'global_profiles') THEN
        UPDATE users u
        SET full_name = gp.full_name,
            phone     = gp.phone,
            bio       = gp.bio,
            dob       = gp.dob,
            gender    = gp.gender,
            settings  = gp.settings
        FROM global_profiles gp
        WHERE gp.user_id = u.id;
    END IF;
END $$;

-- 3. Move the full_name trigram index onto users.
CREATE INDEX IF NOT EXISTS idx_users_name_trgm ON users USING GIN (full_name gin_trgm_ops);
DROP INDEX IF EXISTS idx_global_profiles_name_trgm;

-- 4. Drop the now-redundant table (FK from global_profiles -> users goes with it).
DROP TABLE IF EXISTS global_profiles;
