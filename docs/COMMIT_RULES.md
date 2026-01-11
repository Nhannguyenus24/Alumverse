
# Commit message rules

This document describes the project's commit message conventions using the general format: `type(scope): subject`.

Main rule (required):

- Format: `feat(folder): message`
  - `type`: the kind of change (examples: `feat`, `fix`, `docs`, `chore`, `refactor`, `test`, `ci`, `perf`, `style`).
  - `scope` (typically a folder or related module): a short, lowercase identifier without spaces or special characters.
  - `message` (subject): a short imperative description, no trailing period, preferably < 50 characters.

Valid examples:

- `feat(auth): add login endpoint`
- `fix(ui): correct button alignment on mobile`
- `docs(readme): update installation steps`

Detailed rules:

- Subject:
  - Use an imperative verb (for example: "add", "remove", "fix", "update").
  - Do not capitalize the first word unnecessarily (except proper names or acronyms).
  - Do not end the subject with a period.

- Body (optional):
  - If needed, add a blank line after the subject and then a more detailed description.
  - The body can explain why the change was made, the approach taken, and any impact (e.g. backwards-incompatible behaviour).

- Footer (optional):
  - Use for `BREAKING CHANGE:` notes or to reference issues/PRs, for example: `Refs #123` or `Closes #45`.

Reference regex (optional; useful for validation hooks):

```
^(feat|fix|docs|chore|refactor|test|ci|perf|style)\([a-z0-9_\-]+\): .{1,50}
```

Tips for concise commits:

- Keep each commit focused on a single logical change (avoid combining multiple unrelated features in one commit).
- For large changes, split them into smaller commits by feature or fix.

Suggested hook (optional):

- Consider adding a `commit-msg` hook to enforce the regex above (e.g. using Husky for JS/TS projects, or a small bash script for other repos).

Summary:

Follow the `type(scope): subject` format, and use `feat(folder): message` for feature changes. Keep commits small and well-described to simplify reviews and tracing.