# CHƯƠNG 3. PHÂN TÍCH YÊU CẦU VÀ THIẾT KẾ HỆ THỐNG

Chương này trình bày quá trình phân tích yêu cầu và thiết kế hệ thống AlumVerse 2026, gồm đặc tả tác nhân và yêu cầu chức năng, thiết kế kiến trúc, thiết kế cơ sở dữ liệu và thiết kế giao diện đa nền tảng.

## 3.1. Phân tích yêu cầu

### 3.1.1. Đặc tả tác nhân

Hệ thống phục vụ sáu nhóm tác nhân. Guest là khách chưa đăng nhập, chỉ xem nội dung công khai. Student và Alumni là hai nhóm người dùng chính. Staff là cán bộ hỗ trợ. Admin quản trị ở cấp khoa, còn SuperAdmin quản trị ở cấp trường. Ở mức mã nguồn, hệ thống dùng một enum vai trò cố định (UserRole) kết hợp cột organization_id để phân biệt phạm vi quản trị theo khoa hay toàn trường, thay cho cơ chế tạo và sửa vai trò linh hoạt của bản 2024. Cách này giảm độ phức tạp và đủ dùng ở quy mô một nền tảng cựu sinh viên.

[Bảng 3.1: Đặc tả các tác nhân và ánh xạ sang UserRole cùng phạm vi organization_id]

[Hình 3.1: Sơ đồ use-case tổng quan theo nhóm module]

### 3.1.2. Yêu cầu chức năng

Danh mục tính năng gồm khoảng 105 tính năng thuộc 14 nhóm module: Xác thực và phân quyền, Hồ sơ người dùng, Tổ chức (Multi-tenant), Diễn đàn, Sự kiện, Nhắn tin, Nội dung (tin tức, việc làm, học liệu, thành tích), Cố vấn, Gây quỹ, Thông báo, Trợ lý ảo, Xác minh và một số nhóm giao diện chung. Danh mục này là căn cứ thống nhất cho phân tích yêu cầu, phân công và đánh giá mức độ hoàn thành. Danh sách đầy đủ được trình bày ở Phụ lục A.

[Bảng 3.2: Các nhóm module và số lượng tính năng]

### 3.1.3. Đặc tả use-case tiêu biểu

Một số use-case tiêu biểu được đặc tả chi tiết, gồm: đăng ký tài khoản kèm xác thực OTP, đăng ký hồ sơ cố vấn có lưu nháp và gợi ý kỹ năng tự động, đặt lịch và phản hồi buổi cố vấn, đóng góp quỹ qua mã QR với đối soát tự động, tạo chủ đề và trả lời trên diễn đàn, và nhắn tin riêng sau khi được chấp nhận kết nối.

[Bảng 3.3: Đặc tả một số use-case tiêu biểu]

### 3.1.4. Yêu cầu phi chức năng

Hệ thống hướng tới các yêu cầu phi chức năng chính: xử lý bất đồng bộ để phục vụ nhiều kết nối đồng thời; hỗ trợ nhiều đơn vị trên cùng một triển khai; bảo mật ở mức xác thực, phân quyền và chống bot; và khả năng bảo trì thông qua tổ chức module rõ ràng cùng kiểm thử tự động cho tầng nghiệp vụ.

## 3.2. Thiết kế kiến trúc hệ thống

### 3.2.1. Kiến trúc tổng thể

Backend là một ứng dụng Spring Boot duy nhất, tổ chức theo Modular Monolith với các package nghiệp vụ: auth, user, organization, admin, article, event, forum, fundraising, mentorship, chat và shared. Mỗi module tuân theo kiến trúc Layered, với luồng xử lý: request đến controller, controller kiểm tra dữ liệu và gọi service, service xử lý nghiệp vụ và gọi dao, dao truy xuất PostgreSQL qua R2DBC.

[Hình 3.2: Sơ đồ kiến trúc Modular Monolith và Layered]

[Bảng 3.4: Các package module và controller tiêu biểu]

### 3.2.2. Phân tách dữ liệu và phân quyền đa đơn vị

Dữ liệu của từng khoa được phân tách bằng cột organization_id. Frontend nhận diện tổ chức qua slug hoặc tên miền phụ; backend gắn organization_id vào JWT khi đăng nhập và lọc truy vấn theo phạm vi tổ chức. Phân quyền dựa trên enum UserRole kết hợp organization_id: cùng vai trò Admin, phạm vi dữ liệu được phép thao tác phụ thuộc vào organization_id gắn với tài khoản.

[Hình 3.3: Cơ chế lọc dữ liệu theo organization_id]

[Hình 3.4: Sơ đồ phân quyền RBAC đơn giản hóa (enum UserRole kết hợp organization_id)]

### 3.2.3. Luồng xử lý bất đồng bộ

Toàn bộ luồng xử lý dùng kiểu Mono và Flux của Project Reactor, không chặn luồng từ controller tới dao. R2DBC bảo đảm truy cập cơ sở dữ liệu cũng theo cơ chế bất đồng bộ, giúp hệ thống duy trì hiệu năng khi số kết nối đồng thời tăng.

## 3.3. Thiết kế cơ sở dữ liệu

### 3.3.1. Sơ đồ thực thể và các nhóm bảng

Cơ sở dữ liệu được tổ chức thành các nhóm bảng theo module: Danh tính và Tổ chức, Xác minh, Sự kiện, Cố vấn, Diễn đàn, Gây quỹ, Nội dung, Nhắn tin và Quản trị. So với tám nhóm thực thể của bản 2024, phiên bản 2026 bổ sung các nhóm bảng cho gây quỹ, việc làm, học liệu và cố vấn có cấu trúc. Cột organization_id xuất hiện ở hầu hết các bảng nghiệp vụ để cô lập dữ liệu theo khoa.

[Hình 3.5: Sơ đồ thực thể cốt lõi của AlumVerse 2026]

[Bảng 3.5: Các nhóm bảng chính và bảng tiêu biểu]

### 3.3.2. Quản lý lược đồ và migration

Lược đồ cơ sở dữ liệu được quản lý bằng các tập lệnh migration SQL có phiên bản theo ngày, cập nhật liên tục trong quá trình phát triển. Hệ thống chưa dùng công cụ migration phiên bản như Flyway hay Liquibase; nội dung này được ghi nhận là hướng phát triển.

### 3.3.3. Chiến lược ánh xạ dữ liệu bất đồng bộ (Reactive Data Mapping)

Khác với Spring Data JPA của bản 2024, R2DBC không hỗ trợ tải lười (lazy loading) và không tự động nạp các quan hệ One-to-Many hay Many-to-Many. Vì vậy nhóm áp dụng chiến lược ánh xạ dữ liệu tường minh gồm hai phần. Thứ nhất, các truy vấn phức tạp được viết trực tiếp bằng SQL qua chú thích @Query trong tầng dao; toàn hệ thống có hơn 480 truy vấn tùy biến, trong đó các phép nối bảng được viết rõ trong câu lệnh thay vì để khung tự sinh. Thứ hai, khi cần ghép nhiều quan hệ, dữ liệu được tổng hợp ở tầng service bằng các toán tử phản ứng như flatMap, zipWith và collectList, thay cho cơ chế join tự động của ORM đồng bộ.

Cách làm này giúp kiểm soát chính xác câu lệnh sinh ra và tránh truy vấn dư thừa theo kiểu N+1, đổi lại nhóm phải tự quản lý việc gom nhóm và ghép dữ liệu quan hệ. Ví dụ, khi lấy danh sách người cố vấn kèm thông tin thành viên, hệ thống dùng một truy vấn SQL có sẵn phép nối, rồi ánh xạ kết quả sang đối tượng truyền dữ liệu ở tầng service.

[Hình 3.5b: Luồng ghép dữ liệu quan hệ ở tầng service bằng toán tử phản ứng]

## 3.4. Thiết kế giao diện và luồng đa nền tảng

### 3.4.1. Giao diện web

Ứng dụng web được xây dựng bằng React 19 với Vite, giao diện dùng Material UI, quản lý trạng thái bằng Zustand, truy vấn dữ liệu bằng React Query và gọi API bằng Axios. Các trang và thành phần được tổ chức theo module nghiệp vụ; route được bảo vệ dựa trên JWT và vai trò.

[Hình 3.6: Một số màn hình tiêu biểu của ứng dụng web]

### 3.4.2. Ứng dụng di động

Ứng dụng di động được xây dựng bằng Flutter với Riverpod cho quản lý trạng thái, go_router cho điều hướng và Dio cho gọi API. Ứng dụng dùng chung tầng API với web và ưu tiên các luồng nghiệp vụ chính.

### 3.4.3. Sơ đồ tuần tự các luồng tiêu biểu

Các luồng nghiệp vụ trọng tâm được mô tả bằng sơ đồ tuần tự, gồm đăng ký và kích hoạt OTP, đặt lịch cố vấn, đóng góp quỹ và đối soát qua webhook, và nhắn tin thời gian thực qua WebSocket.

[Hình 3.7: Sơ đồ tuần tự đăng ký và kích hoạt OTP]

[Hình 3.8: Sơ đồ tuần tự đặt lịch cố vấn]

[Hình 3.9: Sơ đồ tuần tự đóng góp quỹ và đối soát Sepay]

[Hình 3.10: Sơ đồ tuần tự nhắn tin thời gian thực qua WebSocket]

## 3.5. Thiết kế logic cấp phát và chống trùng lịch cố vấn

Cố vấn (Mentorship) là nhóm tính năng tạo giá trị cốt lõi, trong đó bài toán khó về mặt logic là cấp phát lịch và tránh đặt trùng. Mỗi khung giờ rảnh (availability slot) của người cố vấn mang một trạng thái, khởi tạo ở AVAILABLE.

Khi người cố vấn tạo hoặc sửa một khung giờ, hệ thống kiểm tra chồng lấn bằng một truy vấn đếm số khung giờ giao nhau trong cùng người cố vấn; nếu số khung giờ giao nhau lớn hơn không, thao tác bị từ chối. Khi một người học đặt lịch vào một khung giờ, hệ thống chỉ chấp nhận nếu khung giờ đang ở trạng thái AVAILABLE, sau đó chuyển khung giờ sang trạng thái đã đặt và tạo bản ghi buổi cố vấn ở trạng thái chờ xác nhận. Người đặt sau nhìn thấy khung giờ không còn ở trạng thái AVAILABLE sẽ bị từ chối, nhờ vậy hai người không thể đặt trùng một khung giờ.

Cơ chế dựa trên trạng thái này xử lý được phần lớn tình huống. Với trường hợp hai yêu cầu đặt lịch đến gần như đồng thời trên cùng một khung giờ, hướng phát triển là chuyển sang cập nhật có điều kiện theo trạng thái ở mức câu lệnh SQL hoặc dùng khóa lạc quan, để bảo đảm chỉ một yêu cầu thành công ngay cả khi hai luồng cùng đọc trạng thái AVAILABLE.

[Bảng 3.6: Máy trạng thái của khung giờ và buổi cố vấn]
