# Tài Liệu Toàn Diện - Tất Cả Chức Năng & Scenarios Test
**Hệ thống Cựu Sinh Viên HCMUS**

**Cập nhật:** 23 tháng 7 năm 2026  
**Trạng thái:** ✅ TẤT CẢ CHỨC NĂNG ĐÃ ĐƯỢC TRIỂN KHAI

---

## 📋 Mục lục

1. [Xác Thực & Đăng Nhập](#1-xác-thực--đăng-nhập)
2. [Hồ Sơ & Cài Đặt Người Dùng](#2-hồ-sơ--cài-đặt-người-dùng)
3. [Tạo & Quản Lý Nội Dung](#3-tạo--quản-lý-nội-dung)
4. [Tin Tức & Hoạt Động](#4-tin-tức--hoạt-động)
5. [Sự Kiện & Vé](#5-sự-kiện--vé)
6. [Gây Quỹ & Quyên Góp](#6-gây-quỹ--quyên-góp)
7. [Diễn Đàn Thảo Luận](#7-diễn-đàn-thảo-luận)
8. [Tin Nhắn & Chat](#8-tin-nhắn--chat)
9. [Mạng Lưới Kết Nối](#9-mạng-lưới-kết-nối)
10. [Hướng Dẫn & Cố Vấn](#10-hướng-dẫn--cố-vấn)
11. [Khảo Sát & Phản Hồi](#11-khảo-sát--phản-hồi)
12. [Danh Hiệu & Thành Tích](#12-danh-hiệu--thành-tích)
13. [Phát Triển Sự Nghiệp](#13-phát-triển-sự-nghiệp)
14. [Quản Lý Admin](#14-quản-lý-admin)
15. [Chủ Tổ Chức & Đa Tổ Chức](#15-chủ-tổ-chức--đa-tổ-chức)
16. [Thông Báo](#16-thông-báo-notifications)
17. [FitBot - Trợ Lý AI](#17-fitbot---trợ-lý-ai)

---

## 1. Xác Thực & Đăng Nhập

### Chức Năng Chính
- ✅ Đăng ký tài khoản mới với email
- ✅ Xác minh email qua mã OTP
- ✅ Đăng nhập với email/mật khẩu
- ✅ Đăng nhập qua Google OAuth
- ✅ Quên mật khẩu & đặt lại
- ✅ Thay đổi mật khẩu
- ✅ Thay đổi email với xác minh
- ✅ Đăng xuất
- ✅ Phiên hết hạn - tự động đăng xuất
- ✅ Khôi phục phiên (refresh token)

### Scenarios Test
- [ ] Đăng ký tài khoản mới → Nhận OTP email → Xác minh → Hoàn tất
- [ ] Đăng nhập với email/password → Chuyển hướng tới trang chủ
- [ ] Đăng nhập qua Google → Tạo tài khoản tự động hoặc liên kết
- [ ] Quên mật khẩu → Gửi link reset → Tạo mật khẩu mới → Đăng nhập
- [ ] Hết session → Yêu cầu đăng nhập lại → Điều hướng lại
- [ ] Đổi mật khẩu trong cài đặt → Cập nhật thành công
- [ ] Đổi email → Xác minh email cũ → Xác minh email mới
- [ ] Đăng xuất → Xóa session → Chuyển tới trang đăng nhập
- [ ] Đăng nhập trên nhiều thiết bị cùng lúc
- [ ] Token hết hạn tự động làm mới

---

## 2. Hồ Sơ & Cài Đặt Người Dùng

### Chức Năng Chính

#### 2.1 Xem & Chỉnh Sửa Hồ Sơ
- ✅ Xem hồ sơ cá nhân
- ✅ Chỉnh sửa thông tin cá nhân (tên, tiểu sử, số điện thoại)
- ✅ Tải ảnh đại diện
- ✅ Tải ảnh bìa hồ sơ
- ✅ Thêm liên kết mạng xã hội
- ✅ Thêm thông tin học tập (trường, chuyên ngành, năm học)
- ✅ Xem hồ sơ người dùng khác (công khai)
- ✅ Chia sẻ hồ sơ

#### 2.2 Cài Đặt Thông báo
- ✅ Tùy chọn nhận email thông báo
- ✅ Tùy chọn nhận push notification
- ✅ Tùy chọn nhận thông báo trong ứng dụng
- ✅ Đặt mức độ ưu tiên thông báo
- ✅ Yêu cầu xác minh - lịch sử
- ✅ Xóa tài khoản thiết bị

#### 2.3 Cài Đặt Tài Khoản
- ✅ Thay đổi mật khẩu
- ✅ Xem lịch sử đăng nhập
- ✅ Quản lý các phiên hoạt động
- ✅ Đặt ngôn ngữ ưa thích (Tiếng Việt/English)
- ✅ Light dark mode
- ✅ Bật/tắt xác thực hai yếu tố (nếu có)
- ✅ Danh sách những người bị chặn

#### 2.4 Quyền Riêng Tư & An Toàn
- ✅ Quản lý ai có thể nhắn tin
- ✅ Chặn/bỏ chặn người dùng

### Scenarios Test
- [ ] Tải ảnh đại diện → Xem trước → Lưu → Xác nhận cập nhật
- [ ] Chỉnh sửa thông tin hồ sơ → Lưu → Kiểm tra thay đổi
- [ ] Tải ảnh bìa → Cắt/điều chỉnh → Lưu
- [ ] Thêm thông tin học tập → Xác minh từ cơ sở dữ liệu → Chấp nhận/từ chối
- [ ] Cài đặt thông báo theo loại → Nhận/không nhận thông báo tương ứng
- [ ] Thay đổi ngôn ngữ → Giao diện thay đổi ngay lập tức
- [ ] Xem lịch sử đăng nhập → Hiển thị thời gian, địa chỉ IP, thiết bị
- [ ] Chặn người dùng → Họ không thể nhắn tin hay xem hồ sơ
- [ ] Bỏ chặn người dùng → Khôi phục truy cập

---

## 3. Tạo & Quản Lý Nội Dung

### Chức Năng Chính

#### 3.1 Tạo Bài Viết
- ✅ Tạo bài viết tin tức/blog
- ✅ Tạo bài viết về sự kiện
- ✅ Tạo bài viết tuyển dụng
- ✅ Tạo bài viết gây quỹ
- ✅ Tạo bài viết tài nguyên học tập
- ✅ Tạo bài viết thành tích

#### 3.2 Chỉnh Sửa Bài Viết
- ✅ Tiêu đề, nội dung, hình ảnh
- ✅ Chọn danh mục
- ✅ Lưu nháp
- ✅ Xuất bản
- ✅ Chỉnh sửa bài viết đã xuất bản
- ✅ Xóa bài viết

#### 3.3 Quản Lý Bài Viết
- ✅ Xem danh sách bài viết của tôi
- ✅ Phân loại: Nháp, Xuất bản, Lưu trữ
- ✅ Tìm kiếm bài viết

### Scenarios Test
- [ ] Tạo bài viết → Nhập tiêu đề, nội dung → Thêm hình ảnh → Lưu nháp
- [ ] Tiếp tục chỉnh sửa nháp → Cập nhật → Xuất bản
- [ ] Xuất bản bài viết → Hiển thị trên trang chủ/feed
- [ ] Chỉnh sửa bài viết đã xuất bản → Cập nhật → Lưu
- [ ] Xóa bài viết → Yêu cầu xác nhận → Xóa vĩnh viễn
- [ ] Tìm kiếm theo danh mục → Hiển thị kết quả phù hợp
- [ ] Thêm tag → Gợi ý tag liên quan
- [ ] Sao chép bài viết → Tạo bản nháp mới với nội dung
- [ ] Chia sẻ bài viết → Sao chép link hoặc chia sẻ SNS

---

## 4. Tin Tức & Hoạt Động

### Chức Năng Chính
- ✅ Xem feed/dòng tin tức
- ✅ Xem tin tức theo danh mục
- ✅ Xem tin tức từ những người theo dõi
- ✅ Xem chi tiết tin tức
- ✅ Bình luận trên tin tức
- ✅ Lưu tin tức để đọc lại
- ✅ Chia sẻ tin tức
- ✅ Tìm kiếm tin tức

### Scenarios Test
- [ ] Mở trang chủ → Xem feed tin tức mới nhất
- [ ] Nhấp vào bài viết → Xem chi tiết đầy đủ
- [ ] Thích bài viết → Cập nhật số lượt thích
- [ ] Bình luận trên bài viết → Bình luận hiển thị ngay
- [ ] Trả lời bình luận → Tạo chuỗi thảo luận
- [ ] Lưu bài viết → Thêm vào "Bài viết đã lưu"
- [ ] Chia sẻ bài viết → Sao chép link hoặc gửi tin nhắn
- [ ] Tìm kiếm từ khóa → Hiển thị bài viết phù hợp
- [ ] Lọc theo danh mục → Chỉ hiển thị bài viết trong danh mục
- [ ] Xem bài viết từ người dùng khác → Hiển thị tác giả, ngày tạo

---

## 5. Sự Kiện & Vé

### Chức Năng Chính

#### 5.1 Tạo Sự Kiện
- ✅ Tiêu đề, mô tả, hình ảnh
- ✅ Ngày, giờ, địa điểm
- ✅ Số lượng vé tối đa
- ✅ Thời gian đăng ký mở/đóng
- ✅ Phí tham gia (nếu có)
- ✅ Loại sự kiện
- ✅ Lưu nháp / Xuất bản

#### 5.2 Quản Lý Sự Kiện
- ✅ Chỉnh sửa thông tin sự kiện
- ✅ Xem danh sách người đăng ký
- ✅ Xuất danh sách tham dự
- ✅ Gửi nhắc nhở cho người đăng ký
- ✅ Hủy sự kiện
- ✅ Đóng đăng ký sớm

#### 5.3 Đăng Ký & Vé
- ✅ Xem danh sách sự kiện
- ✅ Xem chi tiết sự kiện
- ✅ Đăng ký tham dự → Nhận vé
- ✅ Xem vé của tôi (QR code)
- ✅ Hủy đăng ký
- ✅ Thể hiện quan tâm
- ✅ Lưu sự kiện

#### 5.4 Check-in
- ✅ Quét mã QR vé
- ✅ Xác nhận check-in
- ✅ Xem danh sách người đã check-in

### Scenarios Test
- [ ] Tạo sự kiện mới → Nhập đầy đủ thông tin → Lưu nháp
- [ ] Xuất bản sự kiện → Hiển thị trên danh sách
- [ ] Đăng ký tham dự → Nhận vé (QR code)
- [ ] Xem vé → Hiển thị mã QR
- [ ] Quét QR để check-in → Xác nhận tham dự
- [ ] Hủy đăng ký → Vé bị hủy, sức chứa tăng
- [ ] Xem danh sách người đã đăng ký → Xuất file Excel
- [ ] Gửi nhắc nhở → Người đăng ký nhận email/notification
- [ ] Lưu sự kiện → Thêm vào danh sách "Sự kiện đã lưu"
- [ ] Thể hiện quan tâm → Số lượng quan tâm tăng

---

## 6. Gây Quỹ & Quyên Góp

### Chức Năng Chính

#### 6.1 Tạo Chiến Dịch Gây Quỹ
- ✅ Tiêu đề, mô tả, hình ảnh
- ✅ Mục tiêu gây quỹ (số tiền)
- ✅ Mục đích gây quỹ
- ✅ Tài khoản nhận tiền
- ✅ Ngày bắt đầu/kết thúc
- ✅ Mức độ công khai

#### 6.2 Quản Lý Chiến Dịch
- ✅ Chỉnh sửa thông tin chiến dịch
- ✅ Xem danh sách người quyên góp
- ✅ Xem tổng số tiền gây quỹ
- ✅ Xem tiến độ gây quỹ
- ✅ Đóng chiến dịch
- ✅ Xuất danh sách quyên góp

#### 6.3 Quyên Góp
- ✅ Xem danh sách chiến dịch gây quỹ
- ✅ Xem chi tiết chiến dịch (mô tả, tiến độ)
- ✅ Nhập số tiền quyên góp
- ✅ Chọn phương thức thanh toán
- ✅ Hoàn tất thanh toán
- ✅ Nhận xác nhận quyên góp
- ✅ Tùy chọn ẩn danh/công khai tên

#### 6.4 Lịch Sử & Báo Cáo
- ✅ Xem lịch sử quyên góp của tôi
- ✅ Xem danh sách công khai của những người quyên góp
- ✅ Thống kê gây quỹ
- ✅ Biểu đồ tiến độ

### Scenarios Test
- [ ] Tạo chiến dịch gây quỹ → Nhập đầy đủ thông tin → Xuất bản
- [ ] Xem danh sách chiến dịch → Sắp xếp theo tiến độ, ngày tạo
- [ ] Nhấp vào chiến dịch → Xem chi tiết, biểu đồ tiến độ
- [ ] Quyên góp → Nhập số tiền → Chọn phương thức thanh toán → Hoàn tất
- [ ] Thanh toán thành công → Nhận email xác nhận
- [ ] Xem danh sách người quyên góp → Hiển thị tên (nếu công khai) và số tiền
- [ ] Quyên góp ẩn danh → Không hiển thị tên trong danh sách
- [ ] Xem lịch sử quyên góp → Liệt kê tất cả quyên góp của tôi
- [ ] Chỉnh sửa chiến dịch → Cập nhật thông tin
- [ ] Đóng chiến dịch → Người dùng không thể quyên góp thêm

---

## 7. Diễn Đàn Thảo Luận

### Chức Năng Chính

#### 7.1 Xem Diễn Đàn
- ✅ Xem danh sách danh mục
- ✅ Xem chủ đề trong danh mục
- ✅ Sắp xếp: Mới nhất, Phổ biến, Chưa trả lời
- ✅ Tìm kiếm chủ đề
- ✅ Xem chi tiết chủ đề
- ✅ Xem bài viết/trả lời trong chủ đề

#### 7.2 Tạo Chủ Đề
- ✅ Chọn danh mục
- ✅ Nhập tiêu đề
- ✅ Nhập nội dung
- ✅ Thêm hình ảnh/file đính kèm
- ✅ Thêm tag
- ✅ Xuất bản chủ đề

#### 7.3 Thảo Luận
- ✅ Trả lời chủ đề
- ✅ Trả lời trên bài viết khác
- ✅ Bình chọn (upvote/downvote) bài viết
- ✅ Đánh dấu câu trả lời hữu ích
- ✅ Chỉnh sửa bài viết của tôi
- ✅ Xóa bài viết của tôi

#### 7.4 Quản Lý Chủ Đề
- ✅ Đăng ký theo dõi chủ đề
- ✅ Nhận thông báo cập nhật chủ đề
- ✅ Báo cáo bài viết không phù hợp
- ✅ Mở khóa chủ đề (admin)

### Scenarios Test
- [ ] Mở diễn đàn → Xem danh sách danh mục
- [ ] Vào danh mục → Xem chủ đề
- [ ] Tạo chủ đề mới → Chọn danh mục → Nhập tiêu đề, nội dung → Xuất bản
- [ ] Xem chủ đề → Hiển thị bài viết đầu tiên và số lượng trả lời
- [ ] Trả lời chủ đề → Nhập nội dung → Gửi
- [ ] Bình chọn bài viết → Số lượng upvote/downvote cập nhật
- [ ] Đánh dấu câu trả lời hữu ích → Nó được tô sáng
- [ ] Chỉnh sửa bài viết → Cập nhật nội dung
- [ ] Xóa bài viết → Xác nhận xóa
- [ ] Đăng ký theo dõi chủ đề → Nhận thông báo khi có trả lời mới
- [ ] Báo cáo bài viết → Gửi cho moderator
- [ ] Tìm kiếm → Hiển thị kết quả phù hợp
- [ ] Lọc theo tag → Chỉ hiển thị chủ đề có tag đó

---

## 8. Tin Nhắn & Chat

### Chức Năng Chính

#### 8.1 Chat Riêng
- ✅ Tìm người để nhắn tin
- ✅ Tạo cuộc trò chuyện riêng
- ✅ Gửi tin nhắn
- ✅ Xem lịch sử tin nhắn
- ✅ Tải lại tin nhắn cũ (cuộn lên trên)
- ✅ Gửi hình ảnh/file
- ✅ Gửi emoji/sticker
- ✅ Xóa tin nhắn
- ✅ Chỉnh sửa tin nhắn

#### 8.2 Chat Nhóm
- ✅ Tạo nhóm chat mới
- ✅ Thêm thành viên vào nhóm
- ✅ Xóa thành viên khỏi nhóm
- ✅ Đặt tên nhóm
- ✅ Đặt ảnh nhóm
- ✅ Quản lý quyền thành viên
- ✅ Rời khỏi nhóm
- ✅ Xóa nhóm

#### 8.3 Tính Năng Chat
- ✅ Thông báo đang gõ (typing indicator)
- ✅ Trạng thái hoạt động (online/offline)
- ✅ Xác nhận đã đọc tin nhắn
- ✅ Pin tin nhắn quan trọng
- ✅ Phản ứng emoji trên tin nhắn
- ✅ Tìm kiếm tin nhắn

#### 8.4 Quản Lý Cuộc Trò Chuyện
- ✅ Xem danh sách cuộc trò chuyện gần đây
- ✅ Ghim cuộc trò chuyện quan trọng
- ✅ Tắt thông báo cuộc trò chuyện
- ✅ Xóa cuộc trò chuyện
- ✅ Chặn/bỏ chặn người dùng
- ✅ Báo cáo cuộc trò chuyện

### Scenarios Test
- [ ] Tìm người → Nhập tên hoặc email → Xem gợi ý
- [ ] Tạo cuộc trò chuyện → Chọn người → Gửi tin nhắn đầu tiên
- [ ] Gửi tin nhắn → Hiển thị ngay lập tức
- [ ] Nhân vật khác trả lời → Nhận thông báo, tin nhắn hiển thị
- [ ] Xóa tin nhắn → Xác nhận xóa → Tin nhắn biến mất
- [ ] Chỉnh sửa tin nhắn → Cập nhật nội dung → Dấu "đã chỉnh sửa"
- [ ] Gửi hình ảnh → Hiển thị preview trong chat
- [ ] Tạo nhóm → Thêm thành viên → Gửi tin nhắn nhóm
- [ ] Rời khỏi nhóm → Không nhận thông báo nhóm nữa
- [ ] Chặn người dùng → Không thể nhắn tin hoặc thấy hồ sơ
- [ ] Tìm tin nhắn cũ → Cuộn lên / tìm kiếm → Hiển thị tin nhắn

---

## 9. Mạng Lưới Kết Nối

### Chức Năng Chính

#### 9.1 Xem Mạng Lưới
- ✅ Xem danh sách kết nối
- ✅ Xem yêu cầu kết nối đến
- ✅ Xem yêu cầu kết nối đã gửi
- ✅ Xem danh sách những người bị chặn
- ✅ Tìm kiếm kết nối

#### 9.2 Gửi & Chấp Nhận Kết Nối
- ✅ Tìm người muốn kết nối
- ✅ Gửi yêu cầu kết nối
- ✅ Xem yêu cầu kết nối đến
- ✅ Chấp nhận yêu cầu kết nối
- ✅ Từ chối yêu cầu kết nối
- ✅ Hủy yêu cầu kết nối đã gửi

#### 9.3 Quản Lý Kết Nối
- ✅ Xem hồ sơ của kết nối
- ✅ Xóa kết nối
- ✅ Chặn kết nối
- ✅ Bỏ chặn
- ✅ Gửi tin nhắn cho kết nối

#### 9.4 Gợi Ý Kết Nối
- ✅ Xem danh sách gợi ý kết nối
- ✅ Lý do gợi ý (cùng khoa, cùng khoá)
- ✅ Gửi yêu cầu từ gợi ý
- ✅ Bỏ qua gợi ý

### Scenarios Test
- [ ] Mở mạng lưới → Xem danh sách kết nối
- [ ] Tìm người → Nhập tên/email → Xem gợi ý
- [ ] Gửi yêu cầu kết nối → Xác nhận gửi
- [ ] Người khác chấp nhận → Trở thành kết nối
- [ ] Xem yêu cầu đến → Chấp nhận hoặc từ chối
- [ ] Xóa kết nối → Xác nhận xóa → Không còn là kết nối
- [ ] Chặn người dùng → Xóa khỏi kết nối + bị chặn
- [ ] Xem danh sách bị chặn → Bỏ chặn
- [ ] Xem hồ sơ kết nối → Hiển thị thông tin đầy đủ
- [ ] Gửi tin nhắn → Mở chat với kết nối

---

## 10. Hướng Dẫn & Cố Vấn

### Chức Năng Chính

#### 10.1 Trở Thành Cố Vấn
- ✅ Đăng ký làm cố vấn
- ✅ Tạo hồ sơ cố vấn (kinh nghiệm, chuyên môn)
- ✅ Tải CV
- ✅ Đặt mức giá/giờ tư vấn (nếu có)
- ✅ Đặt thời gian rảnh (lịch biểu)
- ✅ Quản lý chuyên môn/kỹ năng

#### 10.2 Tìm Cố Vấn
- ✅ Xem danh sách cố vấn
- ✅ Tìm kiếm theo chuyên môn
- ✅ Lọc theo xếp hạng
- ✅ Xem hồ sơ chi tiết cố vấn
- ✅ Xem lịch trình rảnh
- ✅ Xem đánh giá từ người khác

#### 10.3 Đặt Phiên Tư Vấn
- ✅ Chọn cố vấn
- ✅ Chọn ngày/giờ từ lịch rảnh
- ✅ Nhập mục đích tư vấn
- ✅ Xác nhận đặt phiên
- ✅ Nhận xác nhận qua email/notification

#### 10.4 Quản Lý Phiên
- ✅ Xem phiên tư vấn của tôi
- ✅ Xem chi tiết phiên (ngày, giờ, cố vấn)
- ✅ Nhận link cuộc gọi video
- ✅ Hủy phiên (nếu chưa diễn ra)
- ✅ Dời lịch phiên
- ✅ Hoàn nhân video phiên (nếu có)

#### 10.5 Đánh Giá & Phản Hồi
- ✅ Đánh giá cố vấn sau phiên
- ✅ Để lại nhận xét/feedback
- ✅ Xem đánh giá trung bình cố vấn
- ✅ Xem lịch sử phiên

### Scenarios Test
- [ ] Đăng ký làm cố vấn → Nhập thông tin → Tải CV → Chấp thuận
- [ ] Tạo hồ sơ cố vấn → Thêm chuyên môn/kỹ năng
- [ ] Đặt lịch rảnh → Chọn ngày/giờ → Lưu
- [ ] Tìm cố vấn → Lọc theo chuyên môn → Xem danh sách
- [ ] Xem hồ sơ cố vấn → Hiển thị CV, đánh giá, lịch rảnh
- [ ] Đặt phiên → Chọn ngày/giờ → Gửi yêu cầu
- [ ] Cố vấn chấp nhận → Nhận link video call
- [ ] Hoàn thành phiên → Mở form đánh giá
- [ ] Đánh giá cố vấn → Để lại sao và bình luận
- [ ] Xem lịch sử phiên → Liệt kê tất cả phiên
- [ ] Hủy phiên → Xác nhận hủy
- [ ] Dời lịch → Chọn ngày/giờ mới

---

## 11. Khảo Sát & Phản Hồi

### Chức Năng Chính

#### 11.1 Tạo Khảo Sát
- ✅ Nhập tiêu đề khảo sát
- ✅ Nhập mô tả
- ✅ Tạo câu hỏi (nhiều loại)
- ✅ Loại câu hỏi: Trắc nghiệm, Tự luận, Đánh giá sao, Kéo/thả
- ✅ Đặt câu hỏi bắt buộc/tùy chọn
- ✅ Đặt thời gian mở/đóng
- ✅ Lưu nháp / Xuất bản

#### 11.2 Quản Lý Khảo Sát
- ✅ Xem danh sách khảo sát của tôi
- ✅ Chỉnh sửa khảo sát (chỉ khi chưa có phản hồi)
- ✅ Xem thống kê phản hồi
- ✅ Xem danh sách người đã trả lời
- ✅ Xuất kết quả khảo sát (CSV/Excel)
- ✅ Tạo biểu đồ thống kê
- ✅ Đóng khảo sát

#### 11.3 Trả Lời Khảo Sát
- ✅ Xem danh sách khảo sát hoạt động
- ✅ Mở khảo sát
- ✅ Trả lời các câu hỏi
- ✅ Lưu tiến độ (nếu có)
- ✅ Gửi khảo sát
- ✅ Xem cảm ơn sau khi gửi

#### 11.4 Thống Kê & Báo Cáo
- ✅ Biểu đồ tỷ lệ phần trăm
- ✅ Biểu đồ cột
- ✅ Biểu đồ tròn
- ✅ Tóm tắt câu trả lời tự luận
- ✅ Xuất PDF báo cáo

### Scenarios Test
- [ ] Tạo khảo sát → Nhập tiêu đề, mô tả → Thêm câu hỏi
- [ ] Thêm câu trắc nghiệm → Nhập các lựa chọn
- [ ] Thêm câu tự luận → Đặt độ dài tối đa
- [ ] Xuất bản khảo sát → Gửi link tới người dùng
- [ ] Trả lời khảo sát → Chọn đáp án → Gửi
- [ ] Người dùng khác trả lời → Cập nhật trong thống kê
- [ ] Xem thống kê → Hiển thị biểu đồ, %
- [ ] Xem danh sách người trả lời → Liệt kê tên, thời gian
- [ ] Xuất kết quả → Tải file Excel
- [ ] Đóng khảo sát → Không thể trả lời thêm

---

## 12. Danh Hiệu & Thành Tích

### Chức Năng Chính

#### 12.1 Xem Danh Hiệu & Thành Tích
- ✅ Xem hồ sơ danh hiệu cá nhân
- ✅ Xem danh sách thành tích
- ✅ Xem danh sách danh hiệu nhân được
- ✅ Xem danh sách danh hiệu chưa nhân được
- ✅ Xem điều kiện để nhân danh hiệu
- ✅ Xem hồ sơ thành tích người khác

#### 12.2 Yêu Cầu Danh Hiệu
- ✅ Tạo yêu cầu thành tích mới
- ✅ Tải bằng cấp/chứng chỉ
- ✅ Tải proof/hình ảnh
- ✅ Viết mô tả thành tích
- ✅ Gửi yêu cầu xác minh
- ✅ Theo dõi trạng thái yêu cầu

#### 12.3 Xác Minh (Admin/Moderator)
- ✅ Xem danh sách yêu cầu cần xác minh
- ✅ Xem chi tiết yêu cầu + proof
- ✅ Chấp nhận danh hiệu
- ✅ Từ chối danh hiệu (có ghi chú)
- ✅ Yêu cầu bổ sung thông tin

### Scenarios Test
- [ ] Xem hồ sơ danh hiệu của tôi → Hiển thị danh hiệu có
- [ ] Xem danh sách danh hiệu chưa có → Xem điều kiện
- [ ] Yêu cầu thành tích mới → Tải proof → Gửi
- [ ] Admin xem yêu cầu → Xem chi tiết, proof
- [ ] Admin chấp nhận → Danh hiệu thêm vào hồ sơ
- [ ] Admin từ chối → Ghi chú lý do
- [ ] Xem danh sách sắp xếp theo ngày → Mới nhất trước
- [ ] Chia sẻ danh hiệu → Sao chép link hồ sơ

---

## 13. Phát Triển Sự Nghiệp

### Chức Năng Chính

#### 13.1 Xem Cơ Hội Công Việc
- ✅ Xem danh sách công việc
- ✅ Lọc theo ngành, vị trí
- ✅ Tìm kiếm công việc
- ✅ Xem chi tiết công việc
- ✅ Xem thông tin công ty

#### 13.2 Ứng Tuyển
- ✅ Nộp đơn ứng tuyển
- ✅ Tải CV (hoặc sử dụng CV hiện tại)
- ✅ Viết cover letter
- ✅ Theo dõi trạng thái đơn ứng tuyển
- ✅ Hủy đơn ứng tuyển

#### 13.3 Xem Tài Nguyên Học Tập
- ✅ Xem danh sách tài nguyên học tập
- ✅ Lọc theo chủ đề
- ✅ Xem chi tiết tài nguyên
- ✅ Tải tài nguyên
- ✅ Để lại đánh giá/comment

#### 13.4 Xem Khóa Học (Nếu Có)
- ✅ Xem danh sách khóa học
- ✅ Đăng ký khóa học
- ✅ Theo dõi tiến độ học
- ✅ Xem bảng xếp hạng

### Scenarios Test
- [ ] Xem danh sách công việc → Hiển thị 10 công việc mới nhất
- [ ] Tìm kiếm công việc → Nhập từ khóa → Xem kết quả
- [ ] Lọc theo ngành → Chỉ hiển thị công việc trong ngành
- [ ] Xem chi tiết công việc → Hiển thị mô tả, yêu cầu, liên hệ
- [ ] Nộp đơn ứng tuyển → Tải CV → Gửi
- [ ] Theo dõi đơn ứng tuyển → Xem trạng thái (đã nộp, đang xét, phỏng vấn)
- [ ] Xem tài nguyên học tập → Hiển thị tiêu đề, tác giả, ngày
- [ ] Tải tài nguyên → Lưu file
- [ ] Để lại comment → Hiển thị comment

---

## 14. Quản Lý Admin

### Chức Năng Chính

#### 14.1 Bảng Điều Khiển Admin
- ✅ Xem thống kê tổng quát (người dùng, bài viết, sự kiện)
- ✅ Xem hoạt động gần đây
- ✅ Xem cảnh báo/vấn đề

#### 14.2 Quản Lý Người Dùng
- ✅ Xem danh sách tất cả người dùng
- ✅ Tìm kiếm người dùng
- ✅ Xem chi tiết người dùng
- ✅ Chỉnh sửa thông tin người dùng
- ✅ Xóa người dùng
- ✅ Khoá/mở khoá người dùng
- ✅ Đặt vai trò (admin, staff, user)
- ✅ Xem lịch sử hoạt động người dùng

#### 14.3 Quản Lý Nội Dung
- ✅ Quản lý bài viết (xem, chỉnh sửa, xóa, phê duyệt)
- ✅ Quản lý sự kiện (xem, chỉnh sửa, xóa)
- ✅ Quản lý diễn đàn (quản lý danh mục, topic, post)
- ✅ Quản lý khảo sát
- ✅ Quản lý gây quỹ
- ✅ Xét duyệt nội dung bị báo cáo

#### 14.4 Quản Lý Xác Minh
- ✅ Xem yêu cầu xác minh tài khoản (kiểm tra hộp thư đại học)
- ✅ Xem yêu cầu xác minh thành tích
- ✅ Phê duyệt/từ chối xác minh
- ✅ Xem lịch sử xác minh

#### 14.5 Cài Đặt Tổ Chức
- ✅ Quản lý thông tin tổ chức (tên, logo, mô tả)
- ✅ Quản lý thành viên tổ chức
- ✅ Đặt vai trò cho thành viên (chủ tổ chức, moderator, member)
- ✅ Quản lý danh mục nội dung
- ✅ Cài đặt chính sách
- ✅ Xem lịch sử hoạt động

#### 14.6 Báo Cáo & Thống Kê
- ✅ Xem báo cáo người dùng (đăng ký, hoạt động)
- ✅ Xem báo cáo nội dung (bài viết, bình luận)
- ✅ Xem báo cáo tương tác (thích, chia sẻ, bình chọn)
- ✅ Xuất báo cáo

#### 14.7 Nhật Ký Kiểm Toán (Audit Logs)
- ✅ Xem nhật ký hoạt động của admin
- ✅ Xem nhật ký thay đổi dữ liệu
- ✅ Lọc theo người dùng, loại hành động, ngày tháng
- ✅ Xuất nhật ký

### Scenarios Test
- [ ] Đăng nhập admin → Xem bảng điều khiển
- [ ] Xem danh sách người dùng → Tìm kiếm người dùng
- [ ] Xem chi tiết người dùng → Xem hồ sơ, hoạt động, bài viết
- [ ] Xóa người dùng → Xác nhận xóa
- [ ] Khoá người dùng → Họ không thể đăng nhập
- [ ] Mở khoá người dùng → Họ có thể đăng nhập lại
- [ ] Xem yêu cầu xác minh → Xem proof, chấp nhận/từ chối
- [ ] Quản lý nội dung → Duyệt bài viết, xóa không phù hợp
- [ ] Xem nhật ký kiểm toán → Liệt kê tất cả hoạt động admin
- [ ] Xuất báo cáo → Tải file Excel
- [ ] Quản lý danh mục diễn đàn → Thêm/xóa/chỉnh sửa
- [ ] Xem thống kê → Biểu đồ người dùng, hoạt động

---

## 15. Chủ Tổ Chức & Đa Tổ Chức

### Chức Năng Chính

#### 15.1 Đa Tổ Chức
- ✅ Người dùng có thể thuộc nhiều tổ chức
- ✅ Chuyển đổi tổ chức (bối cảnh)
- ✅ Xem thông tin tổ chức hiện tại
- ✅ Xem danh sách tổ chức của tôi
- ✅ Rời khỏi tổ chức
- ✅ Tạo tổ chức mới

#### 15.2 Vai Trò & Quyền Hạn
- ✅ Chủ tổ chức (Owner) - Full quyền
- ✅ Quản trị viên (Admin) - Quản lý nội dung, người dùng
- ✅ Nhân viên (Staff) - Duyệt nội dung
- ✅ Thành viên (Member) - Đăng nội dung, bình luận
- ✅ Vai trò khác tùy theo tổ chức

#### 15.3 Quản Lý Tổ Chức
- ✅ Chỉnh sửa thông tin tổ chức
- ✅ Tải logo/banner tổ chức
- ✅ Quản lý thành viên (thêm, xóa, thay đổi vai trò)
- ✅ Gửi lời mời thành viên
- ✅ Xem danh sách yêu cầu gia nhập
- ✅ Chấp nhận/từ chối yêu cầu gia nhập

#### 15.4 Tùy Chỉnh Tổ Chức
- ✅ Chọn màu/chủ đề (light/dark)
- ✅ Cài đặt quyền riêng tư
- ✅ Cài đặt nội dung (danh mục bài viết, tính năng bật/tắt)
- ✅ Cài đặt thông báo
- ✅ Tích hợp SNS (nếu có)

### Scenarios Test
- [ ] Xem danh sách tổ chức của tôi → Hiển thị tất cả tổ chức
- [ ] Chuyển đổi tổ chức → Lựa chọn tổ chức khác → Bối cảnh thay đổi
- [ ] Tạo tổ chức mới → Nhập tên, mô tả → Tạo
- [ ] Thêm thành viên → Gửi lời mời → Họ chấp nhận → Trở thành thành viên
- [ ] Thay đổi vai trò thành viên → Từ member → admin
- [ ] Xem logo tổ chức → Hiển thị ở header
- [ ] Thay đổi màu chủ đề → Giao diện thay đổi
- [ ] Rời khỏi tổ chức → Xác nhận → Không còn thành viên
- [ ] Xem yêu cầu gia nhập → Chấp nhận hoặc từ chối
- [ ] Chỉnh sửa tính năng bật/tắt → Ẩn/hiện tính năng từ menu

---

## 16. Thông Báo (Notifications)

### Chức Năng Chính

#### 16.1 Nhận Thông Báo
- ✅ Thông báo khi có bài viết mới từ người theo dõi
- ✅ Thông báo khi có bình luận trên bài viết của tôi
- ✅ Thông báo khi có tin nhắn mới
- ✅ Thông báo khi có yêu cầu kết nối
- ✅ Thông báo khi yêu cầu được chấp nhận
- ✅ Thông báo khi có trả lời trên diễn đàn tôi theo dõi
- ✅ Thông báo sự kiện (sắp tới, nhắc nhở)
- ✅ Thông báo chiến dịch gây quỹ (cập nhật)
- ✅ Thông báo phiên cố vấn
- ✅ Thông báo khảo sát mới
- ✅ Thông báo hệ thống (bảo trì, cập nhật)

#### 16.2 Hiển Thị Thông Báo
- ✅ Badge số trên icon thông báo (header)
- ✅ Toast notification (pop-up)
- ✅ Push notification (nếu cho phép)
- ✅ Email notification (tùy chọn)
- ✅ In-app notification (banner)

#### 16.3 Quản Lý Thông Báo
- ✅ Xem danh sách tất cả thông báo
- ✅ Lọc: Tất cả, Chưa đọc, Đã đọc
- ✅ Sắp xếp: Mới nhất trước
- ✅ Đánh dấu thông báo là đã đọc
- ✅ Đánh dấu tất cả là đã đọc
- ✅ Xóa thông báo
- ✅ Xóa tất cả thông báo
- ✅ Nhấp vào thông báo → điều hướng tới nội dung liên quan

#### 16.4 Cài Đặt Thông Báo
- ✅ Tùy chọn loại thông báo (email, push, in-app)
- ✅ Bật/tắt thông báo cho từng loại
- ✅ Đặt mức độ ưu tiên (tất cả, quan trọng, không)
- ✅ Yên tĩnh (không thông báo trong khoảng thời gian)
- ✅ Quản lý thiết bị nhận push notification
- ✅ Xóa thiết bị khỏi danh sách nhận thông báo

### Scenarios Test
- [ ] Mở NotificationPage → Xem danh sách thông báo
- [ ] Nhấp vào thông báo chưa đọc → Đánh dấu đã đọc → Điều hướng tới nội dung
- [ ] Lọc "Chưa đọc" → Chỉ hiển thị thông báo chưa đọc
- [ ] Đánh dấu tất cả là đã đọc → Badge trên icon biến mất
- [ ] Xóa thông báo → Xác nhận xóa → Thông báo biến mất
- [ ] Ai đó gửi tin nhắn → Nhận toast notification
- [ ] Ai đó bình luận bài viết tôi → Badge +1 trên icon
- [ ] Mở cài đặt thông báo → Tùy chỉnh loại thông báo
- [ ] Tắt "Email notification" → Không nhận email
- [ ] Đặt "yên tĩnh 22h-8h" → Không nhận thông báo vào lúc đó
- [ ] Đăng ký device → Nhận push notification
- [ ] Xóa device khỏi danh sách → Không nhận push trên device đó

---

## 17. FitBot - Trợ Lý AI

### Chức Năng Chính

#### 17.1 Mở FitBot
- ✅ Nút FitBot floating ở góc dưới cùng bên phải
- ✅ Nhấp nút → Mở chat panel
- ✅ Đóng chat panel (X button hoặc click bên ngoài)
- ✅ FitBot sẵn sàng trả lời

#### 17.2 Chat Với FitBot
- ✅ Nhập câu hỏi/yêu cầu
- ✅ FitBot xử lý và trả lời
- ✅ Hỗ trợ Markdown trong câu trả lời
- ✅ Hỗ trợ emoji/sticker
- ✅ Typing indicator (FitBot đang soạn)

#### 17.3 Chức Năng FitBot
- ✅ Trả lời câu hỏi về hệ thống
- ✅ Hướng dẫn sử dụng tính năng
- ✅ Hỗ trợ tìm kiếm (giáo dục, công việc, sự kiện)
- ✅ Gợi ý nội dung phù hợp
- ✅ Hỗ trợ đa ngôn ngữ (Tiếng Việt/English)
- ✅ Giải đáp câu hỏi chung

#### 17.4 Quản Lý Lịch Sử Chat
- ✅ Lưu lịch sử cuộc trò chuyện (7 ngày)
- ✅ Xem lịch sử chat cũ
- ✅ Xóa lịch sử chat
- ✅ Tìm kiếm trong lịch sử
- ✅ Sao chép tin nhắn từ FitBot
- ✅ Chia sẻ câu trả lời của FitBot

#### 17.5 Giao Diện FitBot
- ✅ Avatar FitBot
- ✅ Tên "FitBot" hiển thị
- ✅ Responsive trên mobile/tablet
- ✅ Dark mode support
- ✅ Lịch sử cuộc trò chuyện hiển thị rõ ràng

### Scenarios Test
- [ ] Mở trang bất kỳ → Thấy nút FitBot floating
- [ ] Nhấp nút FitBot → Chat panel mở
- [ ] Nhập câu hỏi → Gửi → FitBot trả lời
- [ ] Xem lịch sử chat → Liệt kê tất cả tin nhắn
- [ ] Đóng chat → Dữ liệu lưu lại
- [ ] Mở FitBot lại → Lịch sử chat hiển thị
- [ ] Hỏi FitBot về tính năng → Nhận hướng dẫn
- [ ] Hỏi FitBot tìm sự kiện → Nhận gợi ý
- [ ] FitBot trả lời Markdown → Định dạng đúng
- [ ] Sao chép câu trả lời → Dán vào nơi khác
- [ ] Chia sẻ câu trả lời → Tạo link hoặc sao chép
- [ ] Xóa lịch sử chat → Xác nhận xóa
- [ ] Chat với FitBot trên mobile → Responsive đúp
- [ ] FitBot hỗ trợ Tiếng Việt → Trả lời bằng Tiếng Việt
- [ ] FitBot hỗ trợ English → Trả lời bằng English

---

## 📊 Tóm Tắt Chức Năng

| Lĩnh Vực | Chức Năng | Trạng Thái |
|---------|----------|----------|
| Xác Thực | Đăng ký, đăng nhập, OTP, OAuth, reset password | ✅ |
| Hồ Sơ | Xem/chỉnh sửa, ảnh đại diện, bìa, học tập | ✅ |
| Cài Đặt | Thông báo, ngôn ngữ, quyền riêng tư, tài khoản | ✅ |
| Nội Dung | Tạo/chỉnh sửa bài viết, lưu, chia sẻ | ✅ |
| Tin Tức | Xem feed, bình luận, thích, lưu | ✅ |
| Sự Kiện | Tạo, đăng ký, vé, check-in QR | ✅ |
| Gây Quỹ | Tạo chiến dịch, quyên góp, thanh toán | ✅ |
| Diễn Đàn | Tạo chủ đề, trả lời, bình chọn, báo cáo | ✅ |
| Chat | Tin nhắn riêng, nhóm, file, emoji | ✅ |
| Mạng Lưới | Kết nối, gợi ý, chặn | ✅ |
| Cố Vấn | Hồ sơ, lịch, đặt phiên, đánh giá | ✅ |
| Khảo Sát | Tạo, trả lời, thống kê | ✅ |
| Danh Hiệu | Yêu cầu, xác minh, xem thành tích | ✅ |
| Công Việc | Xem cơ hội, ứng tuyển | ✅ |
| Tài Nguyên | Xem, tải, comment | ✅ |
| Admin | Quản lý người dùng, nội dung, xác minh | ✅ |
| Đa Tổ Chức | Chuyển đổi, quản lý thành viên, vai trò | ✅ |
| **Thông Báo** | **Badge, toast, push, email, in-app** | **✅** |
| **FitBot** | **Chat AI, hướng dẫn, hỗ trợ, lịch sử** | **✅** |

---

## 🧪 Checklist Test Toàn Diện

### Chung (Áp Dụng Cho Tất Cả Chức Năng)
- [ ] Tính năng hoạt động trên desktop
- [ ] Tính năng hoạt động trên mobile (responsive)
- [ ] Tính năng hoạt động trên tablet
- [ ] Thông báo/toast message hiển thị đúng
- [ ] Xử lý lỗi với thông báo rõ ràng
- [ ] Loading state hiển thị khi tải dữ liệu
- [ ] Phân trang hoạt động đúng
- [ ] Tìm kiếm hoạt động
- [ ] Lọc hoạt động
- [ ] Sắp xếp hoạt động
- [ ] Dữ liệu lưu trong CSDL
- [ ] Ảnh/file tải lên thành công
- [ ] Ảnh/file hiển thị đúng
- [ ] Phiên hết hạn → yêu cầu đăng nhập lại
- [ ] Thảo luận không xác thực → chuyển hướng đăng nhập
- [ ] Xóa dữ liệu → xác nhận
- [ ] Tùy chọn quay lại hoạt động
- [ ] Breadcrumb/lịch sử điều hướng hoạt động
- [ ] Hỗ trợ i18n (Tiếng Việt/English)

### Tính Năng Bổ Sung
- [ ] Real-time updates (nếu có)
- [ ] Notification badges
- [ ] Dark mode (nếu có)
- [ ] Accessibility (ARIA labels, keyboard nav)
- [ ] Performance (tải nhanh, không lag)
- [ ] SEO (meta tags, open graph)

---

## 📝 Ghi Chú Test

**Lưu Ý Khi Test:**
1. Test trên các trình duyệt khác nhau (Chrome, Firefox, Safari, Edge)
2. Test với các kích thước màn hình khác nhau
3. Test với tốc độ kết nối chậm
4. Test với dữ liệu lớn (nhiều bài viết, bình luận)
5. Test các edge case (input trống, dữ liệu không hợp lệ)
6. Test quyền hạn (user thường vs admin)
7. Test trên các tổ chức khác nhau
8. Test trên các vai trò khác nhau

---

## ✅ Tiêu Chí Hoàn Thành

Một chức năng được coi là **HOÀN THÀNH** khi:
1. ✅ Giao diện hiển thị chính xác
2. ✅ Tất cả nút/liên kết hoạt động
3. ✅ Dữ liệu lưu vào CSDL
4. ✅ Xử lý lỗi hoạt động
5. ✅ Thông báo/feedback rõ ràng
6. ✅ Responsive trên mobile
7. ✅ Có i18n hỗ trợ
8. ✅ Performance chấp nhận được

