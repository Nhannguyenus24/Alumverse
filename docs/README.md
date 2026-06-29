# Tài liệu dự án Alumnverse

> **Refactoring and Enhancing the Student-Alumni System for HCMUS**

---

## 📁 Cấu trúc

```
docs/
├── pm_works/              # 📌 Quản lý dự án (PM) — tập trung tại đây
│   ├── context/           # Context dự án
│   ├── features/          # Tính năng cốt lõi + đối chiếu code
│   ├── templates/         # Mẫu đề cương, báo cáo LaTeX
│   ├── progress/          # Báo cáo tiến độ
│   ├── mermaid/           # Source diagram
│   ├── images/diagrams/   # Ảnh biểu đồ
│   ├── latex/             # Báo cáo LaTeX chính
│   └── README.md
│
├── postgre.sql, sample.sql
├── CODING_GUIDELINE.md
├── COMMIT_RULES.md
├── TRUNK_BASED_COMMIT_GUIDELINES.md
├── plan_security_followup_authz.md   # 🔒 Follow-up bảo mật: org-scoping, ownership, JWT hardening
└── README.md
```

---

## pm_works — Hướng dẫn nhanh

Toàn bộ tài liệu PM (context, tính năng, đề cương, báo cáo, tiến độ) nằm trong **`pm_works/`**.  
→ Xem chi tiết: [`pm_works/README.md`](./pm_works/README.md)

---

## 🔒 Bảo mật & phân quyền

- [`plan_security_followup_authz.md`](./plan_security_followup_authz.md) — Các hạng mục follow-up sau đợt enforce JWT + role:
  STAFF org-scoping cho `AdminOrganizationController`, ownership checks (huỷ vé sự kiện, sửa/xoá bài forum),
  và JWT verification hardening (đã làm: regression guard `PublicEndpointGuardTest` + thu hồi access token khi logout;
  còn lại: issuer/audience, refresh token rotation/revocation, blacklist dùng chung Redis khi scale).
