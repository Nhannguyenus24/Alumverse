# Trunk-Based Development — Commit Guidelines

This document summarizes recommended practices for commits and branching using Trunk-Based Development (TBD). The goal is to keep `main` deployable, encourage frequent integration, and maintain small, clear commits.

Core principles:

- Trunk: use `main` (or `trunk`) as the primary branch. All work is merged back to trunk frequently.
- Short-lived feature branches: only use feature branches for short work (typically < 1 day to a few days). Avoid long-lived branches.
- Small, frequent commits: each commit should represent a small, reversible change.
- CI required: pushes/merges to `main` must trigger CI; do not merge if CI fails.
- Feature flags/toggles: use them to safely deploy unfinished features without affecting users.

Suggested workflow (example):

1. Create a short-lived branch when developing:
   - Branch names: `feat/<short-desc>` or `fix/<short-desc>` (follow your team's naming convention).
2. Commit frequently using the `type(scope): subject` convention (see `COMMIT_RULES.md`).
3. Push to remote regularly.
4. Open a PR/MR for review when needed; keep PRs small (aim for < 200 changed lines where possible).
5. Rebase or sync with `main` frequently to reduce conflicts (or merge `main` into your branch if your team prefers merge commits).
6. When code is ready and CI passes, merge into `main` (use fast-forward, squash, or your team's preferred merge strategy).

Commit messages and reviews:

- Commit message: follow `type(scope): subject` to keep history readable (e.g. `feat(auth): add login endpoint`).
- PR description: summarize the goal, how to test, and any dependencies or flags that must be toggled.
- If a change is breaking, document it in the footer: `BREAKING CHANGE: ...`.

Branch size and duration:

- Prefer very short branches (minutes → hours → at most a few days). For work longer than a few days, break it into smaller tasks or use feature flags.

Automation & CI:

- Pre-merge checks: linting, unit tests, and static analysis.
- Post-merge: deploy pipeline or smoke tests.
- Optional: add commit message validation in CI or via a `commit-msg` hook.

Practical tips:

- To rollback: revert the offending commit on `main` (small commits are easier to revert safely).
- Use feature flags for UI/backend changes to minimize risk when merging early.
- Avoid force-pushing (`git push --force`) to `main`.

Merge checklist for `main`:

- [ ] CI is green
- [ ] Commit message follows the convention (`feat(folder): message`, etc.)
- [ ] PR includes description and test instructions
- [ ] Breaking changes are documented and communicated

Conclusion:

Trunk-Based Development requires frequent integration, small commits, and strong CI. Pairing it with the `type(scope): subject` commit convention produces a clear, maintainable history.