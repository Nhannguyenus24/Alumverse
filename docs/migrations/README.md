# ⚠️ DEPRECATED — do not add files here

This folder is **historical only**. The old manual workflow
(`docs/postgre.sql` + hand-applied `docs/migrations/*.sql`) has been
**replaced by Flyway**.

All the SQL files in this folder were already applied to production and are
folded into the Flyway baseline (`V1__baseline.sql`). They are kept for
reference and must not be edited or re-run.

## For any new schema change (humans AND AI agents)

**Do NOT create migration files here.** Create a Flyway migration instead:

```
backend/src/main/resources/db/migration/V<n>__snake_case_description.sql
```

Rules:
- Increment `<n>` to the next free number (look at existing `V*` files).
- One schema change per file. Schema only — seed/reference data is handled
  outside Flyway.
- Never edit or rename a migration already merged/applied; add a new `V<n>`
  (Flyway validates checksums and fails on a changed file).

See `backend/src/main/resources/db/migration/README.md` and
`docs/plan_flyway_migration.md` for details.
