# GHI NHỚ & QUY ƯỚC — BÁO CÁO ALUMVERSE 2026
> File chốt các sự thật quan trọng và quy ước trình bày. Đọc trước khi viết/sửa bất kỳ chương nào.
> Cập nhật: 2026-07-09.
>
> **NHÁNH TÀI LIỆU: `docs/bao-cao-2026`** — toàn bộ bản thảo báo cáo (Chương 1-5), file thống kê và file ghi nhớ này nằm trên nhánh này, KHÔNG nằm trên `main` (main giữ sạch cho code). Lấy lại: `git checkout docs/bao-cao-2026`, hoặc lấy 1 file: `git checkout docs/bao-cao-2026 -- <đường dẫn file>`. Bản chuẩn của báo cáo vẫn là Google Docs.

## A. SỰ THẬT BẮT BUỘC NHỚ (đừng nói sai)

1. **KHÔNG có mã nguồn bản 2024.** Chỉ có báo cáo và tài liệu thiết kế (thiết kế tính năng, thiết kế hệ thống, kiến trúc, **cấu trúc CSDL**). → Không thể dựng lại, deploy, hay benchmark bản 2024. Mọi so sánh 2024 vs 2026 là **định tính, dựa trên tài liệu**, KHÔNG đo đối đầu. Mốc "6 giây/API list" của 2024 chỉ là tham chiếu định tính, môi trường khác, không tái lập được.
2. **Đề tài là VIẾT MỚI kế thừa thiết kế** (System Rewrite), không refactor mã cũ. Kế thừa: tài liệu phân tích/thiết kế + cấu trúc CSDL. Không kế thừa: mã nguồn. "Refactoring" trong tên đề tài hiểu ở cấp kiến trúc hệ thống.
3. **Khảo sát: N=90** (KHÔNG phải 174). Người tham gia **không thuần HCMUS**: 74 từ trường thuộc ĐHQG-HCM, 16 từ trường khác trong/ngoài nước. Vai trò: SV năm 3-4 = 55, SV năm 1-2 = 19, CSV = 16. Chỉ dùng làm khảo sát thăm dò định hướng.
   - Sinh viên (gộp 1-2 và 3-4, n=74) và cựu sinh viên (n=16) trả lời **hai bộ câu khác nhau** → Bảng 2.1 tách theo nhóm, không gộp trung bình chung.
4. **Số tính năng: ~105 tính năng / 14 module** (KHÔNG phải 68/16). Trạng thái: 64 Done, 31 In progress, 8 Not started. Hoàn thành thực ~77–80% (KHÔNG phải 95%). Nguồn: `AlumVerse_Feature_Tracker.xlsx`.
5. **Kiểm thử: backend có ~196 hàm test/21 lớp** (JUnit 5, Mockito, StepVerifier). **Frontend 0 test.** (Bản nháp cũ ghi "1 file test" là SAI.)
6. Hạ tầng thật: CI + CD (GitHub Actions), monitoring Prometheus + Grafana, 18 migration SQL theo ngày (chưa Flyway/Liquibase). Backend 446 file/40 controller/11 module; frontend 246 component/83 page; mobile 186 file dart.
7. **PayOS đang gỡ**, Sepay là cổng thanh toán chính. **FitBot** backend còn sơ khai (~8%). **@PreAuthorize** method-level chưa dùng.
8. Cựu sinh viên: giữ **RMIT Active Hub** làm ví dụ mô hình hội viên trả phí (quốc tế), rồi lập luận mô hình này khó áp dụng cho ĐH công lập VN → hướng **FIT@HCMUS** (sự kiện gặp mặt, CLB, quỹ học bổng) là mô hình AlumVerse theo.
9. Mentorship: tham khảo ADPList (quy mô) + **Mentori.vn (tham chiếu chính, thiết kế giống Mentori hơn)**. Insight khảo sát: hình thức cố vấn được ưu tiên là **workshop nhóm nhỏ + chia sẻ tài liệu/CV**, không chỉ 1-1.
10. **AI: dùng LangChain4j + Gemini** cho 5 tác vụ: trích xuất kỹ năng mentor, trích xuất CV, OCR giấy tờ (xác minh), tự động gắn thẻ bài diễn đàn (cron), trợ lý FitBot (SSE). **KHÔNG có RAG** (không embedding, không vector store, không pgvector — chỉ có dependency langchain4j + langchain4j-google-ai-gemini). → Không được viết là có RAG. **RAG là HƯỚNG PHÁT TRIỂN** cho FitBot (để trả lời bám dữ liệu trường/khoa).

## B. QUY ƯỚC TRÌNH BÀY

10. Văn phong **khoa học, súc tích, mạch lạc**; KHÔNG dùng gạch ngang dài (—) hay gạch nối trung (–).
11. **Thuật ngữ chuyên ngành giữ tiếng Anh** (không dịch): Reactive Programming, Microservices, Entity, Multi-tenant, Modular Monolith, Layered, WebFlux, R2DBC, System Rewrite. Khái niệm có tiếng Việt rõ nghĩa thì dùng tiếng Việt: tái cấu trúc/tái thiết kế, cải tiến.
12. **Trích dẫn hệ số IEEE**: trong bài chỉ `[n]`, KHÔNG nêu tên tác giả trong câu (nêu khái niệm/định nghĩa rồi gắn [n]). Đánh số theo **thứ tự xuất hiện lần đầu** toàn báo cáo.
13. Số nào chưa đo được thật thì để **placeholder**, không bịa (load test 5.4, UAT/engagement 5.7).

## C. DANH MỤC TÀI LIỆU THAM KHẢO (17 nguồn, thứ tự xuất hiện)

1. Obeng-Ofori & Kwarteng (2021) — vai trò cựu sinh viên.
2. UniSel (2015) — vai trò cựu sinh viên.
3. AlumVerse 2024 — báo cáo TTDATN khóa trước.
4. Bộ GD&ĐT — Công văn 3943/2018 & 2919/2017 (việc làm SV tốt nghiệp).
5. Nabi và cộng sự (2024) — mentoring & phát triển nghề nghiệp.
6. ADPList / MentorCruise — nền tảng cố vấn quốc tế.
7. Cộng đồng cố vấn VN (Vietnam Alumni Mentoring, UEH, Chevening, Mentori.vn…).
8. Cunningham (1992) — nguồn gốc thuật ngữ technical debt (WyCash, OOPSLA).
9. Fowler (2018) — Refactoring, 2nd ed.
10. Lewis & Fowler (2014) — Microservices.
11. Fowler (2002) — Patterns of Enterprise Application Architecture (Layered).
12. R. C. Martin (2017) — Clean Architecture.
13. Reactive Manifesto (2014).
14. Chong, Carraro & Wolter (2006) — Multi-Tenant Data Architecture.
15. RMIT Active Hub — membership cựu sinh viên.
16. FIT@HCMUS — trang hoạt động cựu sinh viên (con điền URL).
17. Khảo sát 3.000+ SV "Việt Youth to Business" (2017).

> Trích dẫn đầy đủ + nhật ký xác minh: cần dựng lại file `DanhMuc_...xlsx` (đã mất khi workspace reset).

## D. TRẠNG THÁI CÁC CHƯƠNG
- Chương 1 (Giới thiệu): xong, [1]-[7].
- Chương 2 (Cơ sở lý thuyết & hiện trạng): xong, [1]-[17], 10 hình + 10 bảng. File Excel bảng/biểu đồ: `Chuong2_BangBieu.xlsx`.
- Chương 3, 4, 5: xong bản có chiều sâu kỹ thuật (Reactive Data Mapping, slot/race, reactive security, idempotency Sepay, reactive transaction, hardware baseline, value-driven metrics). Còn placeholder hình/bảng và số load test/UAT.
