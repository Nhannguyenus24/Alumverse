# BÀN GIAO NGỮ CẢNH — Báo cáo tốt nghiệp AlumVerse 2026

_Đọc file này là đủ để tiếp tục, không cần kể lại từ đầu._
_Người dùng: Nguyễn Thị Thu Ngân (xưng "con"/"em", gọi trợ lý là "thầy"). Vai trò trợ lý: QA/PM Coworker._

---

## 1. TỆP ĐANG LÀM

| Tệp | Vai trò |
|---|---|
| `docs/pm_works/baocao/AlumVerse_BaoCaoCuoi.tex` | **Bản chính**, một tệp duy nhất, toàn bộ báo cáo |
| `docs/pm_works/baocao/Pictures/` | 33 ảnh đang dùng |
| `docs/pm_works/baocao/AlumVerse_BaoCaoCuoi.pdf` | Bản biên dịch mới nhất |
| `docs/pm_works/AlumVerse_Feature_Tracker_v3.xlsx` | Danh mục 86 tính năng sau rà soát |
| `docs/pm_works/Khung_BaoCaoCuoi_DungHop.docx` | Khung dung hợp, dùng để đối chiếu cấu trúc |
| `AlumVerse_DeCuong_final.tex` (trong `pm_works/`) | Đề cương đã chốt, biên dịch sạch |

**Bản sao lưu quan trọng** (trong thư mục `outputs` của phiên cũ, nên chép về repo): `AlumVerse_BaoCaoCuoi.bak2.tex` là mốc an toàn từng dùng để khôi phục.

---

## 2. TRẠNG THÁI HIỆN TẠI

- **133 trang tổng** (gồm 13 trang đề cương chèn nguyên văn), thân bài **81 trang** (yêu cầu khoa: 50–100, không kể bìa/mục lục/tham khảo).
- Biên dịch **sạch, 0 lỗi, 0 tham chiếu treo**.
- Đủ 6 chương + phụ lục. Cấu trúc: Ch1 Mở đầu · Ch2 Cơ sở lý thuyết và hiện trạng · Ch3 Phân tích và Thiết kế · Ch4 Triển khai · Ch5 Thử nghiệm và Đánh giá · Ch6 Kết luận · Phụ lục A.

### Biên dịch
```
xelatex -interaction=nonstopmode AlumVerse_BaoCaoCuoi.tex   # chạy 3 lượt
```
LuaLaTeX cũng chạy. **Không dùng pdfLaTeX** (lỗi fontspec). Font mặc định TeX Gyre Termes; muốn Times New Roman thật thì upload 4 tệp .ttf rồi bỏ chú thích dòng `\setmainfont`.

---

## 3. ⚠ CẢNH BÁO KỸ THUẬT — ĐỌC TRƯỚC KHI SỬA FILE

Đã từng **xóa nhầm toàn bộ Chương 3** vì dùng `s.index()` tìm chuỗi TikZ: điểm đầu khớp ở Chương 2, điểm cuối khớp ở Chương 3, cắt sạch phần giữa. Kéo theo mất bảng `tab:compare2024`.

**Quy tắc bắt buộc khi sửa file bằng script:**
1. Luôn `cp` sao lưu trước khi ghi đè.
2. Định vị khối bằng **nhãn** (`\label{...}`) rồi mới lùi/tiến tìm `\begin{figure}`/`\end{figure}`, KHÔNG tìm theo nội dung TikZ.
3. Sau mỗi bước, kiểm tra `grep -cE '^\\chapter\{'` phải bằng **7** (6 chương + phụ lục).
4. Cẩn thận `s.index(r"\appendix")` — nó khớp nhầm `\appendixname` trong preamble. Dùng mốc `"\appendix\n\chapter{DANH MỤC TÍNH NĂNG"`.
5. Tên tệp tiếng Việt trên máy người dùng lưu dạng **NFD**; chuỗi gõ trong script là NFC nên không khớp. Phải duyệt `os.listdir` và so sánh sau khi `unicodedata.normalize("NFC", ...)`.

---

## 4. QUY ƯỚC VĂN PHONG (bắt buộc giữ)

- **KHÔNG** viết "tiếng Việt (chú thích tiếng Anh)". Thuật ngữ kỹ thuật để nguyên tiếng Anh: Reactive Programming, Multi-tenant, Modular Monolith, Layered, WebFlux, R2DBC, Mentorship, race condition…
- **KHÔNG** dùng em-dash (—).
- **KHÔNG** dịch thuật ngữ chuyên ngành một cách gượng ép.
- Trích dẫn `[n]` theo thứ tự xuất hiện, **không nêu tên tác giả trong câu**, chỉ nêu luận điểm. Đã trích lần đầu thì lần sau không lặp lại nếu không phải thông tin mới.
- Quy cách khoa: Times New Roman 13pt, giãn dòng 1.5, lề trên 3 dưới 3.5 trái 3.5 phải 2 cm, số trang giữa bên dưới, la mã từ Lời cảm ơn rồi Ả-rập từ Chương 1, heading tối đa 3 cấp, đánh số Ả-rập, tiêu đề chương **căn trái** dạng `CHƯƠNG N:`.
- Bảng biểu được phép **xoay ngang khổ giấy** (Phụ lục A đang dùng cách này để giữ cỡ 13).

---

## 5. SỐ LIỆU CHỐT (đã rà soát từ mã nguồn, dùng thống nhất toàn báo cáo)

- **86 tính năng / 15 module** (8 module kế thừa 2024, 7 module mới 2026).
- **80 hoàn thành, 6 đang hoàn thiện, 0 chưa bắt đầu → 93%**.
- Sáu mục còn dở: đính kèm ảnh video trong chat, thông báo đẩy di động, đa ngôn ngữ, trợ lý ảo hỏi đáp, quản trị kho tri thức, gợi ý duyệt bằng AI.
- **45 controller, 364 điểm cuối, 196 hàm kiểm thử đơn vị (21 lớp), 37 test case chức năng** (23 API, 14 UI).
- **13 module mã nguồn** (package): auth, user, organization, admin, article, event, forum, chat, mentorship, fundraising, survey, config, shared. Lưu ý: 15 module tính năng ≠ 13 module code, báo cáo đã giải thích rõ ở mục 3.3.1.
- Cách đếm hoàn thành: **số tính năng hoàn thành / tổng số**, không dùng phần trăm cho từng tính năng. Một tính năng được xem là hoàn thành khi chạy được trên **đúng nền tảng mục tiêu** của nó.

### Bối cảnh kỹ thuật
Spring WebFlux + R2DBC + PostgreSQL, Modular Monolith + Layered. Multi-tenant chia sẻ CSDL theo cột `organization_id`, nhúng vào token. Điểm sáng: idempotency webhook Sepay (dựa trên trạng thái bản ghi, không cần Redis), cô lập dữ liệu 3 lớp.

⚠ **PHÁT HIỆN 2026-07-20 (lượt 2):** hai cơ chế trọng tâm đều **chưa có test cho đúng nhánh quyết định**. `SepayWebhookServiceTest` có 4 ca (sai khóa, thiếu prefix, transferType khác `in`, thành công) nhưng **không có ca nào cho nhánh bỏ qua khi bản ghi đã SUCCESS**. Luồng `bookSession` **không có lớp test nào** (`MenteeServiceTest` không tồn tại). Đã ghi vào mục 5.1.3 và Chương 6 như hạng mục ưu tiên. Viết 2 ca này là việc rẻ nhất để biến hai luận điểm chính từ mô tả thành bằng chứng chạy được.

⚠ **ĐÃ SỬA 2026-07-20 — đừng viết lại kiểu cũ:** báo cáo từng nói đặt lịch cố vấn chống race condition bằng **cập nhật có điều kiện ở tầng CSDL**. Đọc code thì KHÔNG phải vậy:
`MentorAvailabilityR2dbcRepository.updateStatus` là `UPDATE mentor_availabilities SET status=:status WHERE id=:id` (không có `AND status='AVAILABLE'`), không có ràng buộc duy nhất trên `mentorship_sessions.availability_id`, và truy vấn kiểm tra chồng lấn nằm ở endpoint `check-conflict` riêng chứ không nằm trong `bookSession`. Thực tế chỉ là **kiểm tra rồi hành động ở tầng ứng dụng bên trong một `@Transactional`**.
Ngân chọn **sửa báo cáo cho đúng code** (không sửa code). Đã viết lại mục 3.4.3, 4.4.2, Hình 3.5, TC-015 và bổ sung một cặp hạn chế + hướng phát triển ở Chương 6.
Webhook Sepay thì mô tả cũ **đúng với code** (`if existing.getStatus() == SUCCESS -> skip`), giữ nguyên.
**FitBot là service Python riêng** (repo `FitBOT`): LangChain + FastAPI, embedding BAAI/bge-m3, vector store FAISS, chunk 1500/overlap 300, top-k=4, reranker BAAI/bge-reranker-base, LLM gemini-2.5-flash, trả lời SSE qua `/fitbot-api/api/stream-query`. Backend chính dùng LangChain4j + Gemini cho các tác vụ khác (**không RAG**).
Đường dẫn thật: `https://alumverse-hcmus.vercel.app/fit-hcmus`. API: `alumni-api-hcmus.duckdns.org`.
**Không có mã nguồn 2024** để đo lại — mọi số liệu 2024 đều là trích dẫn từ báo cáo khóa trước.

---

## 6. VIỆC CÒN LẠI

### 6.0d. ĐÃ LÀM lượt 4 ngày 2026-07-20

- **Vẽ lại toàn bộ use case bằng PlantUML** thay cho TikZ. Công cụ: `npm install node-plantuml` rồi chạy `java -jar node_modules/node-plantuml/vendor/plantuml.jar -charset UTF-8 -tpng`. Java 11 và Graphviz `dot` có sẵn trong sandbox, tiếng Việt render đúng.
  - Nguồn `.puml` lưu ở `docs/pm_works/baocao/puml/`, kèm `common.txt` (skinparam dùng chung) và `gen.py` (script sinh + đo kích thước). Sửa nội dung thì sửa `.puml` rồi render lại, không sửa tay ảnh PNG.
  - **10 hình**: `uc0-actors` (khái quát hóa 5 tác nhân), `uc1-guest`, `uc2a/2b/2c-student`, `uc3-alumni`, `uc4a/4b-facultyadmin`, `uc5a/5b-schooladmin`.
  - **Bài học về cỡ chữ**: cỡ chữ hiệu dụng trên trang = 15pt × (bề rộng cuối / bề rộng ảnh). Ảnh rộng quá ~1700px thì chữ tụt xuống dưới 8pt. Giữ **một package mỗi hình, 8–13 use case** thì được 8,3–14,9pt. Hai package cạnh nhau làm ảnh rộng gấp đôi và chữ chỉ còn 7pt. `gen.py` in sẵn cỡ chữ hiệu dụng của từng hình để kiểm tra trước khi chèn.
- **SỬA LỖI PHÂN QUYỀN Ngân phát hiện**: use case "Cấu hình giao diện và bật tắt tính năng của đơn vị" trước đây đặt nhầm ở Quản trị khoa. Đã kiểm chứng bằng code: `AdminOrganizationController` (gồm toàn bộ nhóm `features-config`, brand, site-identity, privacy) yêu cầu `@PreAuthorize("hasRole('ADMIN')")`, trong khi Article/Event/Fundraising/Mentorship/Survey/User/Education/Dashboard là `hasAnyRole('ADMIN','STAFF')`. Vậy cấu hình đơn vị là **cấp trường**. Đã chuyển sang `uc5a-schooladmin`.
  Ghi nhớ mô hình vai trò thật: enum `UserRole` chỉ có **ADMIN, USER, STAFF** (thêm MODERATOR ở forum). Phân biệt khoa với trường là bằng `organization_id`, không phải bằng vai trò riêng.
- **Bìa đề cương đã nằm gọn 1 trang** (đề cương còn 13 trang thay vì 14). Nguyên nhân tràn là ảnh giữ chỗ `logo_fit.png` bị vuông; đã tạo lại giữ chỗ **đúng tỉ lệ ảnh thật 1281x341**, nên bố cục hiện tại khớp với khi có ảnh thật.

### 6.0c. ĐÃ LÀM lượt 3 ngày 2026-07-20

- **Gộp đề cương**: biên dịch `AlumVerse_DeCuong_final.tex` thành PDF 14 trang rồi chèn nguyên văn bằng `\includepdf` (gói `pdfpages`) ngay sau Lời cảm ơn, trước Mục lục. Trang đề cương **không đánh số** và **không tính vào bộ đếm** (lưu `\value{page}` trước, khôi phục sau) nên phần đầu vẫn đánh la mã liên tục i, ii, vii... Có dòng ĐỀ CƯƠNG trong mục lục.
  ⚠ Đề cương tham chiếu 2 ảnh **không có trong repo**: `logo_fit.png` và `ucase.png`. Đã tạm sinh 2 ảnh giữ chỗ có chữ "THIEU ANH" đặt trong `Pictures/`. Ngân chỉ cần ghi đè 2 tệp này bằng ảnh thật rồi biên dịch lại, không phải sửa mã.
- **Heading cấp 1**: chapter từ `15/21.5` xuống `14/21`. Mục lục, Danh mục hình vẽ, Danh mục bảng biểu bỏ `\hfill` nên **canh trái** như heading cấp 1, cùng cỡ 14/21.
- **Số liệu giám sát thật vào mục 5.4.3** (mới): Bảng 5.5 với 10 mốc đo cách nhau 30 giây, 2 biểu đồ pgfplots (độ trễ TB/p50/p99 và diễn biến Heap). Số liệu đọc từ dashboard Ngân gửi. Kèm 3 nhận xét và **nói rõ đây KHÔNG phải kiểm thử tải** (đỉnh chỉ 0,56 req/s). Mục kiểm thử tải k6 giữ khung chờ và ghi rõ chưa thực hiện.
- **Ba biện luận kỹ thuật thầy hướng dẫn yêu cầu** (đã xác minh cả ba đều có thật trong code):
  - Mục 4.1.1: viết lại lập luận PostgreSQL so với NoSQL thành 3 luận điểm (toàn vẹn tham chiếu, giao dịch ACID nhiều bảng, truy vấn nhiều phép kết bảng).
  - Mục 4.4.1: thêm luồng **cấp lại token khi chuyển tổ chức** (`POST /auth/switch-organization/{id}`). Hai chi tiết đắt: refresh token **cố ý không xoay vòng** vì chỉ mang định danh người dùng, và **mức xác minh được tính lại theo từng đơn vị** (không phải thành viên thì nhận level 0 = GUEST).
  - Mục 4.5: thêm 2 tiểu mục về **scatter-gather bằng `Mono.zip`** (dùng ~66 chỗ trong code), **Bucket4j + Caffeine** (3 hạn mức: AUTH 5/phút, UPLOAD 5/phút, DEFAULT 100/phút, khóa theo IP+plan, cache 20.000 mục, hết hạn 10 phút), và **Jackson Blackbird**.
- **Giữ số liệu kiểm thử theo repo** dù thầy hướng dẫn yêu cầu khôi phục 207/42/37. Đã soạn `GIAI_TRINH_so_lieu_kiem_thu.md` để Ngân phản hồi thầy, kèm cách hợp thức hóa con số lớn (xuất Postman collection và sheet test case vào repo).

### 6.0b. ĐÃ LÀM lượt 2 ngày 2026-07-20 (theo góp ý của thầy hướng dẫn)

- **UML use case tách theo tác nhân**: bỏ sơ đồ gộp phẳng cũ, thay bằng Hình 3.1 quan hệ khái quát hóa giữa 5 tác nhân (mũi tên tam giác rỗng) + 5 sơ đồ riêng Hình 3.2–3.6 cho Khách vãng lai, Sinh viên, Cựu sinh viên, Quản trị khoa, Quản trị trường. Ký pháp chuẩn: tác nhân hình que, use case hình ellipse, khung system boundary, quan hệ `<<include>>`. Macro `\umlactor` đã thêm vào preamble. Danh sách use case rút gọn từ 86 tính năng ở Phụ lục A.
- **Bảng cho phép ngắt trang**: chuyển 6 bảng từ `table[H]`+`tabular` sang `longtable` có lặp lại dòng tiêu đề (`tab:survey`, `tab:engagement`, `tab:compare2024`, `tab:modules`, `tab:testcases`, `tab:sampletc`). Toàn báo cáo giờ chỉ còn 2 `\begin{table}` và cả hai đều nằm trong định nghĩa macro giữ chỗ.
- **Sơ đồ tuần tự chuyển về khổ dọc** (chữ `\small`). Chỉ còn **đúng 1 khối `landscape` là Phụ lục A**.
- **Ảnh thật đã chèn**: 8 ảnh mobile + 6 ảnh responsive copy vào `Pictures/` với tên ASCII (`mob-*.jpg`, `rwd-*.png`). Ảnh web đổi từ lưới 2x2 sang **1 ảnh/hàng full width** (Hình 3.13, 3.14). Mobile 3 ảnh/hàng (Hình 3.15, 3.16). Thêm Hình 3.12 minh họa cùng một trang ở ba nhóm kích thước màn hình. Không còn hình placeholder nào ngoài `fig:loadchart`.
- **Số liệu kiểm thử chốt theo repo**: 215 hàm `@Test` unit / 21 lớp (+1 lớp nạp context). Repo KHÔNG có integration test nào nên đã sửa đoạn mô tả mức tích hợp thành thực hiện thủ công. Mọi chỗ ghi 196 đã đổi.
- **Thêm mục 5.1.3 Độ phủ mã nguồn** với bảng JaCoCo (Class 58%, Line 19%, Instruction 17%, Method 17%, Branch 7%) + diễn giải trung thực.
- **37 → 15 test case**: chỉ giữ 15 test case có thật trong Plan. Dựng lại `tab:testcases`, thay `tab:sampletc` bằng 4 TC có thật, **thêm Phụ lục B** đặc tả đủ 15 TC.
- **Mục 5.3.2** viết sâu thêm: đối chiếu từng nhu cầu khảo sát ở Chương 2 (nghề nghiệp 4,38 · cố vấn 4,27 · quỹ 3,98 · trợ lý ảo 3,84) với phân hệ đã hiện thực, nêu rõ 2 nhu cầu chưa đáp ứng trọn vẹn.

### 6.0. ĐÃ LÀM lượt 1 ngày 2026-07-20

- Rà soát toàn bộ 13 sơ đồ TikZ bằng cách render từng hình ra PNG rồi soi mắt, không đoán theo tọa độ. Đã sửa đè chữ ở `fig:arch2024` (nhãn "Chín dịch vụ" đè ô Eureka), `fig:multiorg` (ô cam đè ô vàng, mất chữ "tài khoản quản trị"), `fig:statemachine` (đường cong quay lại cắt qua ô chú thích), `fig:webhook` (nhãn "Chưa" đè ô chú thích), `fig:usecase` (ellipse chật, đã giãn và tăng cỡ chữ), `fig:moduledeps` (tăng cỡ chữ, mũi tên vòng rõ hơn), `fig:ragarch` (nhãn "tra cứu" nằm trên viền). `fig:erd2024`, `fig:erd2026`, `fig:orgfilter`, `fig:surveychart` kiểm tra lại: vốn đã sạch.
- Mục 3.5.3 "luồng tiêu biểu": chọn đúng hai luồng đã nêu trong **TÓM TẮT** là **đặt lịch cố vấn** và **gây quỹ có đối soát webhook idempotent**, vẽ lại thành **2 sơ đồ tuần tự UML** dựng từ code (`fig:seqbooking` Hình 3.9, `fig:seqdonation` Hình 3.10). Cả hai để **khổ ngang, chữ `\normalsize` = 13pt**, có khung `giao dịch` và khung `alt` đúng ký pháp UML.
- Ảnh sequence kết nối của nhóm (`sd-sequence-ketnoi`) chuyển sang mục 4.4.4 Nhắn tin, nhãn mới `fig:seqconnect` (Hình 4.3) — đúng chỗ hơn vì luồng này không nằm trong tóm tắt.
- Sửa lỗi ngầm: `\label` của các hình/bảng giữ chỗ nằm NGOÀI môi trường float nên ăn số mục (ví dụ `fig:mobilescreens` ra "3.5.2" thay vì "3.8"). Đã thêm macro `\phfigl`/`\phtabl` nhận nhãn bên trong. Ảnh hưởng `fig:mobilescreens`, `fig:loadchart`, `tab:loadtest`, `tab:apiperf`, `tab:beforeafter`, `tab:usertest`.
- Biên dịch 3 lượt: **98 trang, 0 lỗi, 0 tham chiếu treo**.

### 6.1. Ưu tiên cao — vẽ lại sơ đồ UML (chưa làm)
Quy định khoa yêu cầu **hồ sơ thiết kế theo mô hình UML**, nên đây là bắt buộc.
1. **Sơ đồ tác nhân có quan hệ kế thừa** (generalization): Cựu sinh viên kế thừa Sinh viên; Quản trị trường kế thừa Quản trị khoa. Hiện `fig:usecase` đang vẽ phẳng.
2. **Tách use case theo từng tác nhân** thành 5 sơ đồ riêng (Khách vãng lai, Sinh viên, Cựu sinh viên, Quản trị khoa, Quản trị trường). Căn cứ: **AlumVerse 2024 làm đúng cách này** (Hình 2.6–2.10 trong p1.pdf). Khi tách phải cập nhật đánh số hình, danh mục hình, và câu dẫn ở mục 3.1.2.
3. **Chữ trong mọi sơ đồ TikZ phải ≥ 13pt** (hiện đang `\footnotesize`/`\scriptsize`). Có thể cần phóng to khổ sơ đồ hoặc xoay ngang.
4. Sơ đồ nên đọc code để vẽ đúng logic hiện tại, vẽ to và rõ.

**Về sơ đồ tuần tự**: PenK (nhóm điểm 10) **chỉ có đúng 1 sơ đồ tuần tự** trong cả báo cáo, nên 1–2 cái là đủ. Hiện có 1 (sequence kết nối, ảnh của nhóm). Nếu thêm thì nên vẽ luồng đặt lịch cố vấn (chống race condition) từ code.

### 6.2. Chờ số liệu từ nhóm

⚠ **VẪN CÒN THIẾU 2 TỆP ẢNH CHO ĐỀ CƯƠNG** (Ngân đã dán vào chat 20/07 nhưng ảnh dán không thành tệp):
`Pictures/logo_fit.png` (logo fit@hcmus, tỉ lệ 1281x341) và `Pictures/ucase.png` (use case 2024, tỉ lệ 869x421).
Hiện là ảnh giữ chỗ đúng tỉ lệ. **Chỉ cần ghi đè 2 tệp này rồi biên dịch lại đề cương và báo cáo, không phải sửa mã.**

⚠ **ẢNH DÁN VÀO KHUNG CHAT KHÔNG ĐẾN ĐƯỢC CÔNG CỤ TỆP.** Trợ lý xem được ảnh nhưng không cắt/chèn được. Muốn dùng ảnh thì phải **lưu tệp vào một thư mục đã kết nối** (như Ngân đã làm với `Mobile/` và `Responsive Design/`) rồi báo đường dẫn.

- ~~Ảnh màn hình di động~~ — xong, đã chèn từ thư mục `Mobile/` và `Responsive Design/`.
- **Ảnh dashboard giám sát** (Ngân dán 2026-07-20): đọc được các chỉ số tổng gồm 1.753 request, độ trễ trung bình 26,78 ms, thời gian hoạt động 2h36m, 283 lỗi, tỉ lệ lỗi 16,14%. Bảng endpoint và các trục biểu đồ quá nhỏ để đọc chính xác. **Cần lưu tệp gốc vào thư mục kết nối** để cắt và chèn.
  ⚠ Lưu ý khi viết: tỉ lệ lỗi 16,14% nhìn rất xấu nếu để trần. Phần Phân tích ngoại lệ cho thấy phần lớn là `FORBIDDEN`, `NOT_FOUND`, `*_PROFILE_NOT_FOUND` tức là **4xx có chủ đích khi kiểm thử phân quyền**, không phải lỗi hệ thống. Phải tách 4xx nghiệp vụ khỏi 5xx trước khi đưa con số này vào báo cáo, nếu không hội đồng sẽ hỏi ngay.
- **Số đo k6**: số người dùng đồng thời, p50, p95, throughput, tỉ lệ lỗi. Dùng cho `fig:loadchart`, `tab:loadtest`, `tab:apiperf`.
- **So sánh trước/sau tối ưu** (`tab:beforeafter`): đo bằng cách bật/tắt cache Caffeine, drop/create index, đổi kích thước pool — KHÔNG đo được "trước/sau WebFlux" vì không có bản blocking đối chứng, đã ghi rõ giới hạn này trong báo cáo.
- **Thử nghiệm người dùng** (`tab:usertest`): chưa thực hiện. Mục 5.7 đã viết theo hướng thiết kế kịch bản + nêu giới hạn đánh giá, KHÔNG viết như đã làm xong.

### 6.3. Rà soát cuối
- ~~Sửa các sơ đồ TikZ còn đè chữ~~ — xong toàn bộ, xem mục 6.0.
- Bổ sung nguồn chính thức cho trích dẫn khảo sát 3.000 sinh viên (đang đánh dấu `[Cần bổ sung nguồn chính thức]`).
- Kiểm tra thông tin thư mục của trích dẫn RAG (Lewis và cộng sự, NeurIPS 2020).

---

## 7. QUYẾT ĐỊNH ĐÃ CHỐT (không bàn lại)

- Bỏ Phụ lục B (test case). Bù lại: Chương 5 có bảng tổng hợp test case theo module + 4 test case tiêu biểu trình bày đầy đủ, trong đó TC-015 và TC-028 minh chứng cho chống race condition và idempotency.
- Đã loại khỏi phạm vi 5 tính năng: SYS-04, REC-01, FND-05, MEN-11, FND-07. REC-01 chuyển sang hướng phát triển ở Chương 6.
- Mục 5.8 cũ đã gom vào 6.3; hạn chế của **quá trình đánh giá** giữ ở 5.7.
- Chương 4 mô tả **luồng dữ liệu và thiết kế**, tuyệt đối không viết kiểu hướng dẫn sử dụng.
- Báo cáo chủ động nêu **quan hệ phụ thuộc vòng** giữa `shared` và vài module nghiệp vụ như nợ kỹ thuật tự nhận diện (mục 4.3.1) — đây là điểm cộng, giữ nguyên.
- Cô lập dữ liệu: tham quan chéo giữa đơn vị là **chủ đích thiết kế**, có tính năng cố ý xuyên đơn vị (chat, event, network); chỉ thao tác quản trị và dữ liệu riêng tư mới bị chặn.
