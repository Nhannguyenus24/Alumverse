# ⚠️ DEPRECATED — do not add files here

This folder is **historical only**. The old manual workflow
(`docs/postgre.sql` + hand-applied `docs/migrations/*.sql`) has been
**replaced by Flyway**.

All the SQL files in this folder were already applied to production and are
folded into the Flyway baseline (`V1__baseline.sql`). They are kept for
reference and must not be edited or re-run.

## For any new schema change (humans AND AI agents)

**Do NOT create migration files here.** Create a Flyway migration instead,
named with a UTC timestamp version:

```
backend/src/main/resources/db/migration/V<yyyyMMddHHmmss>__snake_case_description.sql
```

Example: `V20260718143000__add_status_to_events.sql`

Rules:
- Use the current UTC timestamp as the version (avoids collisions across
  parallel branches; always sorts after the `V1` baseline).
- One schema change per file. Schema only — seed/reference data is handled
  outside Flyway.
- Never edit or rename a migration already merged/applied; add a new
  timestamped migration (Flyway validates checksums and fails on a changed
  file).

See `backend/src/main/resources/db/migration/README.md` and
`docs/plan_flyway_migration.md` for details.
