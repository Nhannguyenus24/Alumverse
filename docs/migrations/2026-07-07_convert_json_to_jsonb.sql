-- Convert json to jsonb to fix SELECT DISTINCT equality comparison issues
-- PostgreSQL json type does not support equality, which causes BadSqlGrammarException in Spring

-- users table
ALTER TABLE users 
    ALTER COLUMN links TYPE jsonb USING links::text::jsonb,
    ALTER COLUMN settings TYPE jsonb USING settings::text::jsonb;

-- organizations table
ALTER TABLE organizations 
    ALTER COLUMN brand_config TYPE jsonb USING brand_config::text::jsonb,
    ALTER COLUMN features_config TYPE jsonb USING features_config::text::jsonb,
    ALTER COLUMN programs TYPE jsonb USING programs::text::jsonb,
    ALTER COLUMN majors TYPE jsonb USING majors::text::jsonb;

-- organization_introductions table
ALTER TABLE organization_introductions 
    ALTER COLUMN leaders TYPE jsonb USING leaders::text::jsonb,
    ALTER COLUMN team_members TYPE jsonb USING team_members::text::jsonb;
