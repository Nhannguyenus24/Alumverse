-- Audit event-related schema against docs/postgre.sql (source of truth).
-- Returns one row per check: status = OK | MISSING | TYPE_MISMATCH
-- Run: psql ... -f docs/migrations/audit_event_schema.sql

\set ON_ERROR_STOP on

WITH expected_tables AS (
  SELECT unnest(ARRAY[
    'events',
    'event_interests',
    'event_tickets',
    'event_questions',
    'event_invitations',
    'event_email_logs'
  ]) AS table_name
),
table_checks AS (
  SELECT
    e.table_name,
    CASE WHEN t.table_name IS NOT NULL THEN 'OK' ELSE 'MISSING' END AS status,
    'table' AS check_type,
    NULL::text AS column_name,
    NULL::text AS expected_type,
    NULL::text AS actual_type
  FROM expected_tables e
  LEFT JOIN information_schema.tables t
    ON t.table_schema = 'public' AND t.table_name = e.table_name
),
expected_columns AS (
  SELECT * FROM (VALUES
    ('event_tickets', 'registration_answers', 'text'),
    ('event_tickets', 'cancel_reason', 'text'),
    ('event_questions', 'options', 'text'),
    ('events', 'topic', 'text'),
    ('events', 'registration_start_at', 'timestamp without time zone'),
    ('events', 'registration_end_at', 'timestamp without time zone')
  ) AS v(table_name, column_name, expected_type)
),
column_checks AS (
  SELECT
    e.table_name,
    CASE
      WHEN c.column_name IS NULL THEN 'MISSING'
      WHEN c.data_type IS DISTINCT FROM e.expected_type THEN 'TYPE_MISMATCH'
      ELSE 'OK'
    END AS status,
    'column' AS check_type,
    e.column_name,
    e.expected_type,
    c.data_type AS actual_type
  FROM expected_columns e
  LEFT JOIN information_schema.columns c
    ON c.table_schema = 'public'
   AND c.table_name = e.table_name
   AND c.column_name = e.column_name
)
SELECT table_name, status, check_type, column_name, expected_type, actual_type
FROM table_checks
UNION ALL
SELECT table_name, status, check_type, column_name, expected_type, actual_type
FROM column_checks
ORDER BY check_type, table_name, column_name;
