# Migration Log

This file is a human-readable index of schema migrations. It is not executable.
The executable SQL source of truth lives in:

```text
backend/src/main/resources/db/migration/
```

Flyway records what has actually run in the database table:

```text
flyway_schema_history
```

Do not copy migration SQL into this file. Add a short summary here when adding
a new Flyway migration.

## Entries

- `V20260718150000__mentorship_reports_resolution.sql`
  Adds resolution tracking fields to `mentorship_reports`, including resolver,
  resolution timestamp, resolution note, and action taken. Adds indexes for
  status-based review queues and reported-member lookups.

- `V20260718150100__add_organization_id_to_achievements.sql`
  Adds `achievements.organization_id`, backfills existing rows from
  `organization_members`, adds a foreign key to `organizations(id)`, and adds
  an index for organization-scoped achievement queries.

- `V20260718150200__drop_published_at_from_article_channels.sql`
  Preserves existing timestamps into `created_at`/`updated_at` where needed,
  then removes duplicated `published_at` columns from `news` and
  `alumni_posts`.
