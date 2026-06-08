# Mentorship refactor — development workflow

## Stacked branches (bắt buộc)

Các feature Mentorship BR refactor phải **xếp chồng nhánh**, không tách từ `main` riêng lẻ:

| Thứ tự | Branch | Base branch (tạo từ) | MR target |
|--------|--------|----------------------|-----------|
| 1 | `docs/mentorship-business-requirements` | `main` | `main` |
| 2 | `fix/mentorship-access-gates` | `docs/mentorship-business-requirements` | `docs/mentorship-business-requirements` (hoặc `main` sau khi #1 merge) |
| 3 | `fix/mentorship-auto-confirm-booking` | `fix/mentorship-access-gates` | branch FEATURE 2 |
| 4 | `fix/mentorship-landing-access-cta` | branch FEATURE 3 | branch FEATURE 3 |
| 5 | `refactor/mentorship-unified-profile` | branch FEATURE 4 | branch FEATURE 4 |
| 6 | `feat/mentorship-complete-feedback` | branch FEATURE 5 | branch FEATURE 5 |
| 7+ | P1 features | branch P0 cuối cùng | branch trước đó |

**Quy tắc:**

```bash
git fetch origin
git checkout -b fix/mentorship-<name> origin/<previous-feature-branch>
# ... implement ...
git push -u origin fix/mentorship-<name>
```

- MR sau **base vào nhánh feature trước**, không vào `main` trực tiếp (trừ FEATURE 1).
- Sau khi MR trước merge vào `main`, rebase nhánh hiện tại lên `main` rồi đổi base MR nếu cần.

## CI local

Chạy trước khi push (mirror `.github/workflows/ci.yml`):

```bash
chmod +x scripts/ci-local.sh
./scripts/ci-local.sh                    # so với origin/main
./scripts/ci-local.sh origin/docs/mentorship-business-requirements  # so với base stacked
```

## Commit message

Format: `type(scope): subject` — subject **≤ 50 ký tự**. Xem [COMMIT_RULES.md](../COMMIT_RULES.md).

## Tooling

- **GitHub CLI:** `brew install gh` → `gh auth login` → `gh pr create`
- **Backend:** Java 17+, `./mvnw -B package -DskipTests && ./mvnw -B test`
- **Frontend:** Node 24+, `npm ci --legacy-peer-deps && npm run build`

## MR checklist

- Scope rõ, chỉ file liên quan feature
- `./scripts/ci-local.sh <base-branch>` pass
- Ghi schema/API changes nếu có
- Không tự merge / approve
