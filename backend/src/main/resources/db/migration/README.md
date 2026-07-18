# Flyway migrations

Schema is managed by **Flyway** (runs over JDBC at application startup; the app
runtime itself uses R2DBC).

## Naming convention

New migrations use a **UTC timestamp** version — avoids version-number
collisions when several people add migrations on parallel branches:

```
V<yyyyMMddHHmmss>__snake_case_description.sql
```

Example: `V20260718143000__add_status_to_events.sql`

- `V1__baseline.sql` — full schema baseline dumped from prod. **Do not edit.**
  On existing/populated databases (prod, dev-with-data) it is recorded as the
  baseline and never executed; on a fresh empty DB it builds the whole schema.
  It stays `V1`; Flyway orders versions numerically so `1` always sorts before
  any `V<timestamp>` migration.
- `V<yyyyMMddHHmmss>__...` — every future schema change. One change per file.

## Rules

- **Never** edit or rename a migration that has been merged/applied — add a new
  timestamped migration instead. Flyway validates checksums and will fail on a
  changed file.
- Use the current UTC timestamp so the version is always greater than existing
  ones.
- Migrations manage **schema only**. Seed/reference data is handled outside
  Flyway (see docs/plan_flyway_migration.md).
- Test a new migration against a fresh local DB before merging.

The legacy manual workflow (`docs/postgre.sql` + `docs/migrations/*.sql` applied
by hand) is replaced by this folder.
