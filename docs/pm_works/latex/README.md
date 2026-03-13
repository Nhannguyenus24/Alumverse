# Báo cáo LaTeX chính

Copy toàn bộ từ `templates/bao-cao-cuoi/` vào đây rồi biên dịch.

```bash
# Từ thư mục pm_works:
cp -r templates/bao-cao-cuoi/* latex/
cd latex
```

## Cấu trúc (sau khi copy)

```
latex/
├── BAO_CAO_MAIN.tex    # File chính
├── front/              # Phần mở đầu
│   ├── loi-cam-on.tex
│   └── tom-tat.tex     # Tóm tắt (VI) + Abstract (EN)
├── chapters/           # Chương 1–5
├── appendix/
│   └── phu-luc.tex
├── references.bib
└── bao_cao_tot_nghiep.pdf  # Tham khảo (không biên dịch)
```

## Biên dịch

```bash
pdflatex BAO_CAO_MAIN.tex
bibtex BAO_CAO_MAIN
pdflatex BAO_CAO_MAIN.tex
pdflatex BAO_CAO_MAIN.tex
```

## Hình ảnh

Đặt trong `pm_works/images/diagrams/`, trong LaTeX dùng:
```latex
\includegraphics[width=0.8\textwidth]{../images/diagrams/ten-file.png}
```
