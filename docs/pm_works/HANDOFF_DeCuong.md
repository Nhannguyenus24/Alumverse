# Ghi chú bàn giao — Đề cương AlumVerse 2026
_Cập nhật: 2026-07 (cho cuộc trò chuyện mới tiếp nối không cần kể lại)._

## Deliverable hiện tại
- File chính: `docs/pm_works/AlumVerse_DeCuong_final.tex` (đề cương thực tập DATN, đã chốt).
- Trạng thái: biên dịch sạch, 14 trang A4. Đã có bản `... copy.tex` do người dùng tự sao lưu — bản canonical là `AlumVerse_DeCuong_final.tex`.

## Compiler & font (Overleaf)
- Compiler: **LuaLaTeX** (Menu > Compiler > LuaLaTeX). XeLaTeX cũng chạy. KHÔNG dùng pdfLaTeX.
- Font mặc định: **TeX Gyre Termes** (miễn phí, tương thích Times New Roman, chạy sẵn Overleaf). Muốn đúng Times New Roman thì upload 4 tệp .ttf rồi bỏ chú thích dòng `\setmainfont{Times New Roman}`.
- Dùng `fontspec` + `polyglossia` (vietnamese). Trích dẫn kiểu `\hyperref[ref:x]{[n]}` trỏ tới `\label` trong danh mục — KHÔNG dùng bibtex.

## Quy ước văn phong (đã áp dụng, giữ nguyên khi sửa tiếp)
- KHÔNG viết "tiếng Việt (chú thích tiếng Anh)". Thuật ngữ kỹ thuật để nguyên tiếng Anh (Reactive Programming, Multi-tenant, Modular Monolith, Layered, WebFlux, R2DBC, Mentorship, race condition...).
- KHÔNG dùng em-dash (—). Trích dẫn IEEE `[n]` theo thứ tự xuất hiện, KHÔNG nêu tên tác giả trong câu.
- Đề cương ở mức ĐỊNH HƯỚNG (giống PenK): KHÔNG liệt kê "14 module / 105 tính năng"; KHÔNG chèn sơ đồ kiến trúc.
- URL đa đơn vị theo PATH: `alumverse.hcmus.edu.vn/fit` (không phải subdomain `fit.alumverse...`).
- AI mô tả trung thực: LangChain4j + Gemini cho các tác vụ trích xuất/kiểm duyệt/trợ lý. KHÔNG khẳng định RAG (mã nguồn chưa có vector store).

## Luận điểm cốt lõi (đã làm mạnh trong mục 2.1)
- Hai trụ cột: Refactoring (tái thiết kế kỹ thuật) + Enhancing (cải tiến nghiệp vụ).
- Vấn đề hệ thống cũ 2024 = 2 nhóm: (nghiệp vụ) chỉ là mạng xã hội thuần túy, không khai thác giá trị alumni; (kỹ thuật) Microservices phức tạp/tốn kém, nợ kỹ thuật, chưa đa đơn vị.
- KẾ THỪA: phân tích yêu cầu nghiệp vụ + mô hình use case + cấu trúc cơ sở dữ liệu của 2024. KHÔNG kế thừa mã nguồn (phát triển mới hoàn toàn để xử lý nợ kỹ thuật). Ý này nhất quán ở 3 nơi: Giới thiệu (2.1), Mục tiêu chính, Phạm vi.

## Kế hoạch: T01–T08 (01–08/2026)
- T08 = trau chuốt báo cáo + cải tiến tính năng theo phản hồi UAT + chuẩn bị poster + bảo vệ. (KHÔNG dồn quảng bá.)

## Còn thiếu (placeholder cần người dùng bổ sung)
- `Pictures/logo_fit.png` và `Pictures/ucase.png` (use case hệ thống 2024). Thiếu thì Overleaf báo thiếu hình nhưng vẫn ra PDF.

## Bối cảnh kỹ thuật đã xác minh từ mã nguồn (dùng khi cần chiều sâu)
- Stack: Spring WebFlux + R2DBC + PostgreSQL (reactive, non-blocking). Multi-tenant shared-DB theo cột `organization_id`, bảo mật qua ReactiveSecurityContext.
- Điểm sáng: idempotency webhook Sepay (marker FD<id> + status-guard); xử lý race condition khi đặt lịch mentorship; 196 @Test backend; CI/CD (GitHub Actions); Prometheus + Grafana.
- KHÔNG có mã nguồn 2024 để so sánh head-to-head (đừng hứa benchmark đối chiếu trực tiếp).

## Lưu ý branch
- Cây làm việc hiện tại: `main`. File ghi nhớ đầy đủ trước đó (`GhiNho_QuyUoc_BaoCao.md`) nằm ở branch `docs/bao-cao-2026`.
