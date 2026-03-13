# Phân tích Refactoring và Enhancing — Alumnverse

## 1. Hệ thống cũ (Prior app 2021)

### 1.1. Hướng tiếp cận: thiên về mạng xã hội

- **Tìm kiếm cựu sinh viên** (năm tốt nghiệp, ngành học, công ty) — follow/kết bạn
- **CLB/nhóm** — giống group Facebook: tạo nhóm, đăng bài, quản lý thành viên
- **Group chat** — nhắn tin 1-1, nhóm
- **Diễn đàn** — thảo luận, tin tức, sự kiện
- **Quyên góp** — dự án thiện nguyện, theo dõi đóng góp
- **Tư vấn/cố vấn** — đặt lịch, đánh giá (đã có nền tảng)

### 1.2. Phân tích engagement (Proposed Features)

| Trường / Nhóm | Số người | Lượt tương tác/bài (like) | Tỉ lệ engagement ước lượng |
|---------------|----------|---------------------------|----------------------------|
| Cựu SV & SV ĐH Sư Phạm Kỹ Thuật | 138.000 | 5–18 | ≈ 0,009–0,013% |
| UEH Alumni | 9.600 | 12+ | ≈ 0,12% |
| Cựu SV ĐH Luật | 6.100 | ~8 | ≈ 0,13% |
| Cựu SV Trường Kiến (UAH) | 15.000 | <23 | ≈ 0,15% |
| Cựu SV Khoa KH&CN Vật liệu – HCMUS (MSTA) | 2.700 | ~9 | ≈ 0,33% |

**Nhận xét:** Cộng đồng lớn thường có engagement rất thấp; nhóm nhỏ, đặc thù (MSTA) có tương tác cao hơn. Mô hình “quan sát, ít trao đổi” không phát huy đủ giá trị alumni.

---

## 2. Thay đổi hướng tiếp cận: giá trị cốt lõi của alumni

### 2.1. Nền tảng lý luận (ROLE_OF_ALUMNI, Obeng-Ofori [1])

| Vai trò alumni | Lý luận | Hướng tính năng Alumnverse |
|----------------|---------|----------------------------|
| **Role model** | Alumni là hình mẫu, truyền cảm hứng cho sinh viên | Chia sẻ trải nghiệm, gương thành công |
| **Career mentor** | Hướng dẫn nghề nghiệp, mở kênh thực tập/việc làm | **Mentorship** (ưu tiên cao) |
| **Providing expertise** | Guest lecturer, tư vấn chuyên môn, hợp tác dự án | Forum chuyên ngành, Q&A |
| **Professional development** | Alumni kỳ cựu hỗ trợ alumni trẻ, cơ hội học tập sau ĐH | Cơ hội nghề nghiệp, khóa học |
| **Recruitment** | Tuyển sinh, chia sẻ kinh nghiệm chọn trường | Tin tức trường, gương thành công |
| **Fundraising** | Học bổng, hoạt động, cơ sở vật chất | Quyên góp, minh bạch đóng góp |
| **Reputation** | Uy tín trường qua thành tựu alumni | Innovation Center, Achievement showcase |

### 2.2. Tính năng mới / nâng cấp (tập trung đóng góp cốt lõi)

| Nhóm | Tính năng mới / nâng cấp |
|------|---------------------------|
| **Mentorship** | Matchmaking mentor–mentee (ngành/kỹ năng), đặt lịch 1-1, theo dõi tiến độ, badge/recognition, feedback form |
| **Career** | Hồ sơ nghề nghiệp, đăng tin tuyển dụng, referral, không gian Q&A kinh nghiệm |
| **Fundraising** | Kênh đóng góp minh bạch, thống kê, báo cáo |
| **Achievement** | Innovation Center — showcase thành tựu alumni qua tin tức |
| **Learning** | Chia sẻ khóa học, tài liệu, cơ hội học sau ĐH |

---

## 3. Khảo sát người dùng (HCMUS)

- **Quy mô:** Khoảng 100+ người (174 phản hồi trong file CSV)
- **Nội dung:** Độ phù hợp tính năng, gợi ý tính năng cho Alumnverse
- **File:** `Khảo sát nhu cầu và mức độ gắn kết giữa Cựu sinh viên & Sinh viên Trường Đại học Khoa học Tự nhiên – HCMUS.csv`

**Các yếu tố được đánh giá:** Cập nhật tin tức, sự kiện, giao lưu cộng đồng, cơ hội nghề nghiệp, khóa học, **mentorship**, đóng góp/gây quỹ, vinh danh cựu sinh viên.

---

## 4. Multi-tenant: bộ công cụ chung

Alumnverse **không chỉ** phát triển một trang web cho một đơn vị, mà cung cấp **khung tính năng (feature framework)** để các khoa khác trong HCMUS có thể tạo trang alumni riêng theo **subdomain** (vd: `cntt.alumnverse.hcmus.edu.vn`, `toan.alumnverse.hcmus.edu.vn`).

### 4.1. Trang thiết lập của Admin (tạo trang mới cho khoa)

**Thông tin chung:**
- Thông tin khoa + tên miền (ký tự mong muốn cho subdomain)
- Logo
- Hình ảnh
- Mã màu đại diện (Header/Footer)

**Cấu hình nâng cao:**
- Màu sắc chữ, màu div, v.v. (có preview)
- Chọn các tính năng có/không có trong trang của khoa (tick vào ô từng tính năng)

**Quản trị:**
- Tạo tài khoản admin mới và phân quyền

**Quy trình:** Preview web với data mẫu → Launch

---

## 5. Nguồn tham khảo

- `[Cũ] Danh sách nghiệp vụ (Prior app 2021).xlsx`
- `Proposed Features for AlumnVerse.docx`
- `[NEW] Alumverse Features.xlsx`
- `ROLE_OF_ALUMNI_IN_UNIVERSITY_rf_source` (UniSel)
- Obeng-Ofori & Kwarteng (2021) — ResearchGate
