# pm_works — Quản lý dự án (PM)

> Toàn bộ tài liệu PM tập trung tại đây. **Chỉ 1 người quản lý.**

---

## Cấu trúc

```
pm_works/
├── context/                    # Context dự án
│   ├── project-overview.md
│   ├── refactoring-analysis.md # Phân tích Refactoring & Enhancing
│   ├── ROLE_OF_ALUMNI_IN_UNIVERSITY_rf_source  # Nguồn lý luận
│   ├── Proposed Features for AlumnVerse.docx
│   ├── [NEW] Alumverse Features.xlsx
│   ├── [Cũ] Danh sách nghiệp vụ (Prior app 2021).xlsx
│   └── Khảo sát nhu cầu...csv
├── features/                   # Tính năng cốt lõi + đối chiếu code
│   ├── core-features.md
│   └── feature-code-feedback.md
├── templates/                  # Mẫu tham khảo
│   ├── de-cuong/              # Đề cương
│   │   ├── DE_CUONG_MAU.md    # Mẫu nội dung (Markdown)
│   │   ├── De_Cuong_mau.docx  # Mẫu đề cương tham khảo
│   │   └── Khung_de_cuong.docx # Khung đề cương FIT
│   └── bao-cao-cuoi/          # Báo cáo cuối kỳ
│       ├── BAO_CAO_MAIN.tex   # Mẫu LaTeX chính
│       ├── bao_cao_tot_nghiep.pdf  # PDF tham khảo
│       ├── chapters/          # Các chương
│       ├── front/             # Lời cảm ơn, Tóm tắt
│       └── references.bib
├── progress/                   # Báo cáo tiến độ
├── mermaid/                    # Source diagram
├── images/diagrams/            # Ảnh export từ Mermaid
├── latex/                      # Báo cáo LaTeX chính (copy từ templates/bao-cao-cuoi)
└── README.md
```

---

## Hướng dẫn

| Loại | File | Ghi chú |
|------|------|---------|
| **Context** | `context/project-overview.md` | Tổng quan, stack, thành viên |
| **Tính năng** | `features/core-features.md` + `feature-code-feedback.md` | Danh sách + đối chiếu code |
| **Đề cương** | `templates/de-cuong/` | `DE_CUONG_TTDATN_ALUMNVERSE.md` — đề cương Alumnverse đã soạn; nộp: điền vào `Khung_de_cuong.docx` |
| **Báo cáo tham khảo** | `templates/bao-cao-cuoi/bao_cao_tot_nghiep.pdf` | Tham khảo cấu trúc, trình bày |
| **Báo cáo LaTeX** | Copy `templates/bao-cao-cuoi/*` → `latex/` | Chỉnh sửa rồi biên dịch |
| **Tiến độ** | `progress/TEMPLATE_BAO_CAO_TIEN_DO.md` | Copy → `tuan-XX.md` |
| **Biểu đồ** | `mermaid/*.mmd` → export → `images/diagrams/` | PNG/SVG cho LaTeX |
