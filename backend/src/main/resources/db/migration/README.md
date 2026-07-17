# Flyway migrations

Schema is managed by **Flyway** (runs over JDBC at application startup; the app
runtime itself uses R2DBC).

## Naming convention

```
V<n>__snake_case_description.sql
```

- `V1__baseline.sql` — full schema baseline dumped from prod. **Do not edit.**
  On existing/populated databases (prod, dev-with-data) it is recorded as the
  baseline and never executed; on a fresh empty DB it builds the whole schema.
- `V2__...`, `V3__...` — every future schema change. One change per file.

## Rules

- **Never** edit or rename a migration that has been merged/applied — add a new
  `V<n>` instead. Flyway validates checksums and will fail on a changed file.
- Increment `<n>` monotonically. Use the next free number.
- Migrations manage **schema only**. Seed/reference data is handled outside
  Flyway (see docs/plan_flyway_migration.md).
- Test a new migration against a fresh local DB before merging.

The legacy manual workflow (`docs/postgre.sql` + `docs/migrations/*.sql` applied
by hand) is replaced by this folder.
