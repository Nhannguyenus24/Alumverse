# ĐỀ CƯƠNG THỰC TẬP DỰ ÁN TỐT NGHIỆP

**Tên đề tài:** Alumnverse: Refactoring and Enhancing the Student-Alumni System for HCMUS  
*(Tái cấu trúc và nâng cấp hệ thống sinh viên – cựu sinh viên cho HCMUS)*

---

## THÔNG TIN CHUNG

| Thông tin | Chi tiết |
|-----------|----------|
| **Người hướng dẫn** | ThS. Hồ Tuấn Thanh, ThS. Nguyễn Lê Hoàng Dũng (Khoa Công nghệ Thông tin) |
| **[Nhóm] Sinh viên thực hiện** | Lâm Tiến Huy - MSSV: 22127151
Nguyễn Thị Thu Ngân - MSSV: 22127290
Kha Vĩnh Thuận - MSSV: 22127408
Nguyễn Trọng Nhân - MSSV: 22127306
Trần Tiến Lợi - MSSV: 22127240
Trần Đức Tùng - MSSV: 22127442|
| **Loại đề tài** | Ứng dụng |
| **Thời gian thực hiện** | Đề cương: cuối T2–đầu T3/2026; Triển khai: từ 05/03/2026 đến 28/06/2026 |

---

## NỘI DUNG THỰC HIỆN

### 1. Giới thiệu về đề tài

Cựu sinh viên (alumni) là nguồn lực quan trọng cho sự phát triển của các trường đại học. Theo Obeng-Ofori và Kwarteng (2021) [1] và UniSel Alumni [2], alumni đóng vai trò thiết yếu: role model, career mentor, cung cấp chuyên môn, hỗ trợ phát triển nghề nghiệp, tuyển sinh, gây quỹ và nâng cao uy tín trường. Mạng lưới alumni hiệu quả giúp kết nối sinh viên – cựu sinh viên và tạo giá trị đóng góp thực sự.

**Phân tích hệ thống cũ:** Ứng dụng trước (Prior app 2021) thiên về mô hình mạng xã hội (tìm kiếm CSV, CLB/nhóm, follow, group chat, diễn đàn). Các trang alumni tương tự trên mạng xã hội thường chỉ đăng thông tin một chiều, không có hoạt động gắn kết cụ thể; hơn nữa đặc tính của các trang alumni không phải là ứng dụng để sử dụng thường xuyên, hàng ngày. Phân tích engagement rate cho thấy tỉ lệ tương tác rất thấp (0,009%–0,33%): cộng đồng lớn thường “quan sát, ít trao đổi”, không phát huy đủ giá trị cốt lõi của alumni. Vì vậy nhóm quyết định thay đổi hướng tiếp cận.

**Thay đổi hướng tiếp cận:** Alumnverse chuyển sang tập trung vào **giá trị đóng góp cốt lõi** — đặc biệt **mentorship** (hướng dẫn nghề nghiệp, matchmaking mentor–mentee), cơ hội việc làm, chia sẻ chuyên môn, đóng góp/gây quỹ, và vinh danh thành tựu — thay vì mô hình “like, follow” thuần túy.

**Khảo sát người dùng:** Dự án đã thực hiện khảo sát khoảng 100 người (sinh viên và cựu sinh viên HCMUS) về độ phù hợp tính năng và gợi ý cho Alumnverse. Kết quả hỗ trợ hướng phát triển mentorship, forum Q&A, networking event, cơ hội nghề nghiệp và kênh đóng góp minh bạch.

**Ý tưởng giải quyết:** Tái cấu trúc hệ thống theo kiến trúc phân tán (frontend React, backend Spring WebFlux), thiết kế lại cơ sở dữ liệu, triển khai các module: xác thực, diễn đàn, sự kiện, tin nhắn, nội dung (tin tức, việc làm, thành tựu), **mentorship**, và **bộ công cụ multi-tenant** cho phép các khoa khác trong HCMUS tạo trang alumni riêng theo subdomain.

**Ý nghĩa thực tiễn:** Alumnverse hướng tới **hệ thống chạy thực tế** — triển khai production, phục vụ người dùng thật (sinh viên, cựu sinh viên HCMUS) — không chỉ dừng ở đồ án demo. Hệ thống hỗ trợ HCMUS quản lý mạng lưới alumni, tạo kênh kết nối có giá trị, đồng thời cung cấp **khung tính năng** tái sử dụng cho nhiều khoa.

---

### 2. Mục tiêu đề tài

**Mục tiêu chính:**

1. Xây dựng **hệ thống chạy thực tế** — triển khai lên môi trường production, phục vụ người dùng thật (sinh viên, cựu sinh viên HCMUS), không chỉ là đồ án demo deploy tạm thời.
2. Tái cấu trúc hệ thống sinh viên – cựu sinh viên theo kiến trúc hiện đại, dễ mở rộng và bảo trì.
3. Nâng cao trải nghiệm người dùng qua giao diện web responsive (máy tính và trình duyệt trên điện thoại).
4. Triển khai các tính năng cốt lõi: xác thực, diễn đàn, sự kiện, tin nhắn, quản lý nội dung (tin tức, việc làm, thành tựu), mentorship.

**Mục tiêu cụ thể:**

- Phân tích và đánh giá hệ thống hiện tại, xác định điểm cần cải thiện (engagement, giá trị đóng góp).
- Thiết kế kiến trúc mới (frontend SPA + backend API reactive), hỗ trợ multi-tenant.
- Triển khai module xác thực (đăng ký, đăng nhập, OTP, quên mật khẩu).
- Triển khai diễn đàn (category, topic, post), đặc biệt diễn đàn sự nghiệp alumni.
- Triển khai quản lý sự kiện (CRUD, đăng ký tham dự, vé, check-in).
- Triển khai tin nhắn (chat riêng, nhóm).
- Triển khai quản lý nội dung: tin tức, tài nguyên học tập, việc làm, thành tựu.
- Triển khai **mentorship**: đăng ký mentor, matchmaking, đặt lịch, theo dõi tiến độ, feedback.
- Triển khai **trang thiết lập admin** (multi-tenant): tạo trang khoa mới, cấu hình bố cục/màu sắc, chọn tính năng, preview, launch.
- Kiểm thử và đánh giá hệ thống.

**Kiến thức/kỹ năng đạt được:**

- Kiến thức: Kiến trúc phần mềm, REST API, reactive programming, quản lý phiên (JWT).
- Kỹ thuật: React, Spring Boot WebFlux, PostgreSQL, Docker.
- Kỹ năng: Phân tích yêu cầu, thiết kế hệ thống, làm việc nhóm, quản lý thời gian.

---

### 3. Phạm vi của đề tài

**Đối tượng nghiên cứu/thực hiện:**

- Hệ thống Alumnverse (mã nguồn tại repository dự án).
- Người dùng: sinh viên, cựu sinh viên, quản trị viên.
- Dữ liệu: thông tin người dùng, diễn đàn, sự kiện, tin nhắn, tin tức, việc làm, thành tựu.

**Đặc điểm:**

- **Multi-tenant:** Alumnverse cung cấp bộ công cụ chung (khung tính năng) để các khoa khác trong HCMUS có thể tạo trang alumni riêng theo subdomain (vd: `cntt.alumnverse.hcmus.edu.vn`).

**Hình thức triển khai:**

- Web application responsive — chạy trên trình duyệt máy tính và **trình duyệt trên điện thoại** (không phát triển ứng dụng native riêng).
- Phạm vi đơn vị: HCMUS (Khoa CNTT triển khai đầu tiên, các khoa khác khi có nhu cầu).
- Các tính năng nâng cao (AI moderation, chatbot phức tạp) có thể nằm ngoài phạm vi ban đầu.

---

### 4. Cách tiếp cận dự kiến

Dự án áp dụng phương pháp phát triển tăng tiến (Agile), chia thành các giai đoạn:

| Giai đoạn | Nội dung |
|-----------|----------|
| **1. Phân tích** | Khảo sát hệ thống hiện tại, thu thập yêu cầu (khảo sát ~100 người), phân tích use case |
| **2. Thiết kế** | Thiết kế kiến trúc, cơ sở dữ liệu, giao diện (responsive) |
| **3. Triển khai** | Phát triển theo từng module (Auth → Forum → Event → Chat → Articles → Mentorship) |
| **4. Kiểm thử** | Unit test, integration test, kiểm thử chấp nhận |
| **5. Vận hành** | Triển khai production, vận hành thử với người dùng thật |
| **6. Tài liệu** | Viết báo cáo, hướng dẫn sử dụng, vận hành |

**Công nghệ sử dụng:** React 19, Vite 7, Material UI 7, Spring Boot 3.5, WebFlux, R2DBC, PostgreSQL, Docker Compose.

---

### 5. Kết quả dự kiến

1. **Hệ thống Alumnverse chạy thực tế** — Triển khai production, phục vụ người dùng thật; web responsive (máy tính và trình duyệt trên điện thoại).
2. **Mã nguồn hệ thống** — Repository hoàn chỉnh (frontend + backend), có thể chạy qua Docker Compose.
3. **Báo cáo đồ án** — Mô tả phân tích, thiết kế, triển khai, đánh giá.
4. **Tài liệu** — Hướng dẫn cài đặt, sử dụng, vận hành.

---

### 6. Kế hoạch thực hiện

*Tham khảo cấu trúc: De_Cuong_mau.docx, bao_cao_tot_nghiep.pdf. Đề cương hoàn thành cuối T2–đầu T3/2026. Triển khai từ 05/03/2026 đến 28/06/2026. Mỗi tháng 4 tuần, trừ các tuần có lễ (VN).*

| Tháng | Mục tiêu tổng quát | Sprint (tuần) | Mục tiêu sprint |
|-------|--------------------|---------------|-----------------|
| **T1** | Chuẩn bị, hoàn thiện đề cương | 06/01–12/01 | Tìm hiểu, giới hạn phạm vi |
| | | 13/01–19/01 | Khảo sát hệ thống cũ, phân tích yêu cầu |
| | | 20/01–26/01 | Hoàn thiện đề cương *(lễ Tết)* |
| | | 27/01–02/02 | Thiết kế kiến trúc, DB sơ bộ |
| **T2** | Đề cương, thiết kế chi tiết | 03/02–09/02 | Thiết kế chi tiết (DB, API spec) |
| | | 10/02–16/02 | Thiết kế giao diện, wireframe |
| | | 17/02–23/02 | **Đề cương hoàn thành, duyệt** |
| | | 24/02–02/03 | Setup project, chuẩn bị triển khai |
| **T3** | Triển khai Auth, Forum | 05/03–11/03 | Triển khai Auth (đăng ký, đăng nhập) |
| | | 12/03–18/03 | Auth (OTP, quên mật khẩu), phân quyền |
| | | 19/03–25/03 | Forum: category, topic, post |
| | | 26/03–01/04 | Forum Alumni Career, search |
| **T4** | Sự kiện, Chat, Nội dung | 02/04–08/04 | Event: CRUD, đăng ký, vé, check-in |
| | | 09/04–15/04 | Chat riêng, nhóm |
| | | 16/04–22/04 | Tin tức, việc làm, thành tựu |
| | | 23/04–29/04 | Mentorship: đăng ký, matchmaking |
| **T5** | Mentorship, Multi-tenant, Kiểm thử | 30/04–06/05 | Mentorship: đặt lịch, feedback *(30/4, 1/5)* |
| | | 07/05–13/05 | Trang thiết lập admin (tạo trang khoa) |
| | | 14/05–20/05 | Cấu hình bố cục, chọn tính năng, preview, launch |
| | | 21/05–27/05 | Kiểm thử tổng hợp, sửa lỗi, tối ưu |
| **T6** | Vận hành thử, Tài liệu, Bảo vệ | 28/05–03/06 | Triển khai production, vận hành thử với user |
| | | 04/06–10/06 | Viết báo cáo, tài liệu hướng dẫn |
| | | 11/06–17/06 | Hoàn thiện báo cáo, demo |
| | | 18/06–28/06 | Chuẩn bị bảo vệ, dự phòng |

*(Điều chỉnh theo kế hoạch thực tế của Khoa.)*

---

### 7. Tài liệu tham khảo

[1] D. Obeng-Ofori and H. O. Kwarteng, “Enhancing the Role of Alumni in the Growth of Higher Education Institutions,” *International Journal of Multidisciplinary Studies and Innovative Research*, vol. 4, pp. 40–48, 2021. doi: 10.21681/IJMSIR-1.3.831.049173-20201.

[2] UniSel Alumni, “Role of Alumni in University Development,” 2015. https://uniselalumni.wixsite.com/uniselalumniconnect/single-post/2015/10/15/role-of-alumni-in-university-development

**Nguồn bổ sung:** Proposed Features for AlumnVerse, [NEW] Alumverse Features.xlsx, [Cũ] Danh sách nghiệp vụ (Prior app 2021).xlsx, Khảo sát nhu cầu và mức độ gắn kết — HCMUS (context/).

---

## Ghi chú

- Nộp chính thức: điền vào **Khung_de_cuong.docx**, in và nộp theo quy định Khoa FIT.
- File này dùng để soạn nội dung trước khi chuyển sang Word.
