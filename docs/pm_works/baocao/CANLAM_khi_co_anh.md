# Việc cần làm khi Thu Ngân gửi folder ảnh

_Ghi nhận theo góp ý ngày làm việc gần nhất. CHƯA thực hiện, chờ ảnh._

---

## 0. ĐÃ CÓ SẴN 10 ẢNH TRONG `Plan chương 3 + 5.docx` (không cần chụp lại)

Trích xuất từ `word/media/`. Chất lượng tốt, nhiều ảnh đẹp hơn bản TikZ thầy tự vẽ nên sẽ dùng thay.

| File trong docx | Nội dung | Dùng cho |
|---|---|---|
| `image3.png` | Kiến trúc 3 tầng, thể hiện rõ 3 kênh HTTP, SSE và WebSocket | Thay Hình 3.4 kiến trúc (tốt hơn bản TikZ) |
| `image4.png` | Luồng xử lý dữ liệu | Mục 3.3.3 luồng bất đồng bộ |
| `image5.png` | Cây thư mục backend, xác nhận đúng 13 module | Mục 4.3.1 cấu trúc mã nguồn backend |
| `image2.png` | Sơ đồ liên quan tổ chức, đơn vị | Mục 3.2 đa tổ chức |
| `image1.png` | Cấu trúc mã nguồn website | Mục 4.3.2 |
| `image8.png`, `image9.png` | **Sequence diagram UML chuẩn** cho luồng gửi và chấp nhận lời mời kết nối rồi nhắn tin | Thay Hình 3.9 sơ đồ tuần tự (chi tiết hơn hẳn bản TikZ) |
| `image10.png` | Trạng thái SUCCESS, liên quan luồng thanh toán | Mục 4.4.3 đối soát |
| `image6.png`, `image7.png` | Ảnh chụp Postman với bộ sưu tập API thật | Mục 5.1.2 công cụ kiểm thử |

**Việc cần làm:** giải nén 10 ảnh này ra thư mục `Pictures/`, đổi tên theo quy ước, chèn vào đúng mục, và bỏ bớt các sơ đồ TikZ bị trùng.

---

## 0b. CẦN XÁC MINH GẤP: tên miền thật

Ảnh Postman cho thấy API thật đang chạy ở `alumni-api-hcmus.duckdns.org`, trong khi báo cáo đang viết đường dẫn đa đơn vị là `alumverse.hcmus.edu.vn/fit`.
Phải hỏi lại nhóm: tên miền chính thức là gì, `alumverse.hcmus.edu.vn` đã được cấp chưa hay mới là dự kiến.
Nếu chưa có thì phải sửa lại mục 2.1.4, 3.2.2 và Hình 3.2 cho khớp thực tế, tránh bị hội đồng hỏi.

---

## A. DANH SÁCH ẢNH CẦN GỬI (đặt tên đúng như dưới đây)

Gửi tất cả vào một thư mục tên `Pictures/` đặt cạnh file `AlumVerse_BaoCaoCuoi.tex`.
Định dạng `.png` hoặc `.jpg`. Ảnh màn hình nên chụp ở độ phân giải cao, cắt gọn viền trình duyệt.

### Nhóm 1 — Nền tảng tham khảo (Chương 2)

| Tên file | Nội dung cần chụp |
|---|---|
| `hinh-2-1_rmit-active-hub.png` | Trang quyền lợi hội viên chương trình RMIT Active Hub |
| `hinh-2-2_fit-hcmus-alumni.png` | Trang hoạt động cựu sinh viên Khoa Công nghệ Thông tin |
| `hinh-2-3_adplist.png` | Giao diện nền tảng ADPList |
| `hinh-2-4_mentori.png` | Giao diện nền tảng Mentori.vn |

### Nhóm 2 — Nền tảng tham chiếu, ghép lưới 3 ảnh (Chương 2, Hình 2.6)

Gửi **ba ảnh rời**, thầy sẽ tự ghép lưới trong LaTeX để căn đều và đẹp hơn ghép sẵn.

| Tên file | Nội dung cần chụp |
|---|---|
| `hinh-2-6a_gayquy.png` | Trang chiến dịch gây quỹ tham chiếu (UEH Alumni hoặc GlobalGiving) |
| `hinh-2-6b_diendan.png` | Cấu trúc phân tầng chuyên mục của một diễn đàn tham chiếu |
| `hinh-2-6c_vieclam.png` | Cổng việc làm hoặc hệ thống học liệu tham chiếu |

### Nhóm 3 — Màn hình sản phẩm, web (Chương 3, Hình 3.7)

Gửi **bốn ảnh rời**, thầy ghép lưới 2x2.

| Tên file | Nội dung cần chụp |
|---|---|
| `hinh-3-7a_web-trangchu.png` | Trang chủ |
| `hinh-3-7b_web-covan.png` | Danh sách người cố vấn |
| `hinh-3-7c_web-diendan.png` | Diễn đàn |
| `hinh-3-7d_web-quantri.png` | Bảng điều khiển quản trị |

### Nhóm 4 — Màn hình sản phẩm, di động (Chương 3, Hình 3.8)

Gửi **bốn ảnh rời**, thầy ghép hàng ngang 4 ảnh dọc.

| Tên file | Nội dung cần chụp |
|---|---|
| `hinh-3-8a_mobile-chondonvi.png` | Màn hình chọn đơn vị |
| `hinh-3-8b_mobile-sukien.png` | Danh sách sự kiện |
| `hinh-3-8c_mobile-chat.png` | Hội thoại nhắn tin |
| `hinh-3-8d_mobile-diemdanh.png` | Màn hình điểm danh bằng QR |

### Nhóm 5 — Logo (tùy chọn)

| Tên file | Nội dung |
|---|---|
| `logo-hcmus.png` | Logo trường, chèn vào bìa chính (hiện đang để trống) |

### Nhóm 6 — KHÔNG cần gửi ảnh, chỉ cần số liệu

**Hình 5.1 biểu đồ hiệu năng**: không gửi ảnh. Chỉ cần gửi **số đo k6** dạng bảng, ví dụ:

```
Số người dùng đồng thời | p50 (ms) | p95 (ms) | throughput (req/s) | tỉ lệ lỗi (%)
100  | ... | ... | ... | ...
300  | ... | ... | ... | ...
500  | ... | ... | ... | ...
1000 | ... | ... | ... | ...
```

Thầy sẽ tự dựng biểu đồ đường bằng pgfplots, đồng bộ kiểu dáng với biểu đồ khảo sát đã có.

---

## B. SƠ ĐỒ CẦN SỬA (lỗi đè chữ Thu Ngân đã phát hiện)

1. **Hình 3.2 Mô hình đa tổ chức** (`fig:multiorg`): ô chú thích vàng "Mỗi tổ chức có riêng..." bị ô cam "Một người dùng có thể thuộc nhiều tổ chức..." đè lên. Cần tách xa hoặc bố trí lại theo chiều dọc.

2. **Hình 2.7 Kiến trúc Microservices 2024** (`fig:arch2024`): nhãn "Chín dịch vụ Spring Boot độc lập" đè lên ô Eureka. Cần hạ nhãn xuống hoặc dời Eureka sang phải.

3. Rà lại toàn bộ các sơ đồ còn lại xem có chỗ nào đè chữ tương tự.

---

## C. SƠ ĐỒ CẦN VẼ LẠI THEO YÊU CẦU MỚI

4. **Sơ đồ tác nhân**: bổ sung **quan hệ kế thừa giữa các tác nhân** (generalization).
   Ví dụ: Cựu sinh viên kế thừa toàn bộ quyền của Sinh viên và bổ sung thêm; Quản trị trường kế thừa quyền của Quản trị khoa.
   Hiện Hình 3.1 use case đang vẽ phẳng, chưa thể hiện tính kế thừa này.

5. **Use case diagram tách theo từng tác nhân**, thay vì một sơ đồ gộp chung.
   Dự kiến tách thành các hình riêng: Khách vãng lai, Sinh viên, Cựu sinh viên, Quản trị khoa, Quản trị trường.
   Khi tách thì phải cập nhật lại: đánh số hình, danh mục hình vẽ, và câu dẫn ở mục 3.1.2.

---

## D. CÁCH THỰC HIỆN KHI CÓ ẢNH

Thầy sẽ thay khối `\phfig{...}{...}{...}` tương ứng bằng `\includegraphics`, tự căn kích thước, ghép lưới và giữ nguyên caption cùng nhãn tham chiếu để không vỡ mục lục hình.
