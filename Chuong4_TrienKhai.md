# CHƯƠNG 4. TRIỂN KHAI HỆ THỐNG

Chương này trình bày môi trường và công nghệ triển khai, quy trình phát triển của nhóm, cách xây dựng các luồng nghiệp vụ trọng tâm, và hạ tầng vận hành cùng bảo mật ứng dụng.

## 4.1. Môi trường và công nghệ triển khai

Backend được xây dựng bằng Spring Boot với WebFlux và R2DBC, truy cập cơ sở dữ liệu PostgreSQL. Frontend web dùng React 19, Vite, Material UI, Zustand, React Query và Axios. Ứng dụng di động dùng Flutter với Riverpod, go_router và Dio. Toàn hệ thống được đóng gói bằng Docker Compose, phục vụ qua Nginx làm reverse proxy, và tự động hóa bằng quy trình CI/CD trên GitHub Actions.

[Bảng 4.1: Công nghệ sử dụng theo từng thành phần]

## 4.2. Quy trình phát triển và cộng tác

Nhóm gồm sáu thành viên, phát triển theo quy trình lặp trong khoảng sáu đến tám tháng. Ở giai đoạn đầu, nhóm chia công việc theo chiều ngang, tách backend và frontend, mỗi nhóm phối hợp trên các module khác nhau để chạy song song. Ở giai đoạn kiểm thử, sửa lỗi nghiệp vụ và rà soát hệ thống, nhóm chuyển sang cách làm theo chiều dọc, đi hết từng tính năng để bảo đảm mỗi tính năng hoạt động hoàn chỉnh từ giao diện tới cơ sở dữ liệu. Về công cụ, nhóm quản lý mã nguồn và luồng phát triển bằng Git theo mô hình tách nhánh và gộp về nhánh chính, và theo dõi tiến độ công việc bằng một bảng danh mục tính năng trên Google Sheets. Bảng này liệt kê khoảng 105 tính năng kèm trạng thái hoàn thành, làm căn cứ thống nhất để phân công, theo dõi và đồng bộ công việc giữa các thành viên.

## 4.3. Triển khai các luồng nghiệp vụ trọng tâm

### 4.3.1. Xác thực và phân quyền

Module xác thực cấp JWT gồm access token và refresh token, gắn userId, vai trò và organization_id. Người dùng đăng ký được xác thực bằng OTP gửi qua email (dựng bằng Thymeleaf), đăng nhập có kiểm tra reCAPTCHA, và có thể đăng nhập bằng tài khoản Google trên web. Việc phân quyền dựa trên cấu hình bảo mật kết hợp kiểm tra vai trò trong tầng service.

Trong môi trường WebFlux, thông tin người dùng không nằm trong ThreadLocal như Spring MVC mà nằm trong ReactiveSecurityContext. Nhóm xây dựng tiện ích SecurityUtils lấy userId, vai trò và organization_id từ ReactiveSecurityContextHolder theo cơ chế không chặn luồng. Khi truy vấn dữ liệu theo tổ chức, một phương thức phân giải organization_id bắt buộc tài khoản cấp khoa chỉ được thao tác trên organization_id của chính mình lấy từ JWT, trong khi tài khoản cấp trường có thể thao tác trên một tổ chức được chỉ định hoặc trên toàn bộ tổ chức. Nhờ vậy, organization_id dùng để lọc câu lệnh SQL luôn được lấy từ ngữ cảnh xác thực thay vì từ dữ liệu do client gửi lên, tránh rò rỉ dữ liệu chéo giữa các khoa.

[Hình 4.1: Luồng lấy organization_id từ ReactiveSecurityContext và áp vào truy vấn]

### 4.3.2. Cố vấn (Mentorship)

Cựu sinh viên đăng ký hồ sơ cố vấn theo biểu mẫu nhiều bước có lưu nháp; hệ thống gọi dịch vụ AI để gợi ý tự động các thẻ kỹ năng từ mô tả chuyên môn. Mentee đăng ký nhu cầu, chọn khung giờ trống của mentor và đặt lịch. Buổi cố vấn đi qua các trạng thái từ chờ xác nhận, được duyệt đến hoàn thành, sau đó mentee gửi phản hồi. Toàn bộ được kiểm tra theo vai trò và organization_id trước khi ghi dữ liệu.

Việc đặt lịch áp dụng cơ chế chống trùng dựa trên trạng thái khung giờ đã trình bày ở mục 3.5: một khung giờ chỉ được đặt khi đang ở trạng thái AVAILABLE, sau đó chuyển sang trạng thái đã đặt, nên yêu cầu đặt sau trên cùng khung giờ sẽ bị từ chối.

### 4.3.3. Gây quỹ và đối soát Sepay

Quản trị viên tạo quỹ kèm thông tin tài khoản nhận. Khi người dùng đóng góp, hệ thống tạo trước một bản ghi đóng góp và sinh mã QR với nội dung chuyển khoản chứa mã định danh của khoản đóng góp đó. Khi tiền về, cổng Sepay gọi một webhook công khai; hệ thống kiểm tra khóa API trong header Authorization, bỏ qua giao dịch không phải kiểu tiền vào, trích mã định danh từ nội dung chuyển khoản và tìm đúng bản ghi đóng góp tương ứng.

Tính idempotent được bảo đảm bằng chính trạng thái của bản ghi đóng góp, không cần thành phần lưu trữ bên ngoài. Nếu bản ghi đã ở trạng thái thành công thì webhook bỏ qua, ngược lại mới cập nhật sang thành công và cộng vào tổng quỹ. Nhờ vậy, khi Sepay gọi lại nhiều lần cho cùng một giao dịch, hệ thống chỉ xử lý một lần và không ghi nhận trùng. Ở đây, khóa idempotent là mã định danh khoản đóng góp lưu trong PostgreSQL, và cờ trạng thái đóng vai trò chốt chặn xử lý lặp. Với trường hợp nhiều lời gọi đến gần như đồng thời, hướng phát triển là dùng câu lệnh cập nhật có điều kiện theo trạng thái để loại bỏ hoàn toàn khả năng cộng trùng. Cấu hình cổng thanh toán PayOS còn tồn tại trong mã nguồn nhưng đang được gỡ bỏ; Sepay là cổng chính.

[Hình 4.2: Luồng đối soát idempotent của webhook Sepay]

### 4.3.4. Diễn đàn

Diễn đàn tổ chức theo danh mục, chủ đề và bài viết, hỗ trợ bình chọn và báo cáo vi phạm. Quản trị viên khoa có thể ẩn hoặc gỡ bài vi phạm. Hệ thống kiểm tra organization_id trước khi ghi để bảo đảm dữ liệu diễn đàn thuộc đúng khoa.

### 4.3.5. Nhắn tin thời gian thực

Tính năng nhắn tin dùng WebSocket. Trước khi nhắn tin riêng, người dùng phải gửi và được chấp nhận yêu cầu kết nối. Hệ thống hỗ trợ cả hội thoại một-một và nhóm chat, lưu lại lịch sử tin nhắn.

### 4.3.6. Trợ lý ảo (FitBot)

Trợ lý ảo trả lời theo cơ chế truyền dòng qua Server-Sent Events, sử dụng mô hình ngôn ngữ Gemini để sinh nội dung. Luồng hội thoại hiện được xử lý chủ yếu ở phía ứng dụng khách gọi trực tiếp mô hình ngôn ngữ, chưa truy hồi dữ liệu nội bộ của trường và khoa, nên độ chính xác với các câu hỏi đặc thù còn hạn chế; phần xử lý phía backend cũng còn sơ khai. Việc bổ sung cơ chế truy hồi tăng cường (Retrieval-Augmented Generation, RAG) để trợ lý trả lời bám sát dữ liệu trường và khoa được ghi nhận là hướng phát triển.

### 4.3.7. Ứng dụng trí tuệ nhân tạo trong hệ thống

Ngoài trợ lý ảo, hệ thống tích hợp trí tuệ nhân tạo cho một số tác vụ nghiệp vụ thông qua thư viện LangChain4j kết nối mô hình Gemini. LangChain4j cho phép khai báo các dịch vụ AI dưới dạng giao diện, trong đó đầu vào là văn bản và đầu ra là một đối tượng có cấu trúc, giúp tích hợp mô hình ngôn ngữ vào luồng nghiệp vụ một cách gọn gàng.

Các tác vụ dùng AI gồm: trích xuất thẻ kỹ năng từ mô tả chuyên môn khi cựu sinh viên đăng ký làm người cố vấn; trích xuất thông tin hồ sơ từ nội dung CV; nhận dạng ký tự quang học (OCR) và làm sạch văn bản OCR để đọc dữ liệu từ ảnh giấy tờ phục vụ xác minh; kiểm duyệt nội dung tự động; và tự động gắn thẻ cho bài viết diễn đàn theo một tác vụ chạy nền định kỳ. Các dịch vụ này được khai báo qua LangChain4j với đầu ra có cấu trúc và đều có cơ chế dự phòng khi khóa mô hình chưa được cấu hình hoặc mô hình không trả về kết quả hợp lệ, nhằm bảo đảm luồng nghiệp vụ không bị gián đoạn.

Các tác vụ trên đều là lời gọi mô hình ngôn ngữ theo từng yêu cầu cụ thể, chưa sử dụng cơ chế truy hồi dữ liệu (RAG). Việc bổ sung truy hồi dựa trên embedding và kho vector để tăng độ chính xác, đặc biệt cho trợ lý ảo, là hướng phát triển tiếp theo.

[Bảng 4.2: Các tác vụ ứng dụng AI và vai trò trong hệ thống]

## 4.4. Tối ưu Frontend và Mobile

Frontend quản lý trạng thái bằng Zustand và dùng React Query để lưu đệm và đồng bộ dữ liệu từ máy chủ, giảm số lần gọi lại. Web và mobile dùng chung một tầng API, giúp thống nhất nghiệp vụ giữa hai nền tảng và giảm chi phí bảo trì.

## 4.5. Hạ tầng, DevOps và bảo mật ứng dụng

Môi trường được định nghĩa bằng Docker Compose, gồm cơ sở dữ liệu và Nginx; Nginx làm reverse proxy tới backend và phục vụ nội dung tĩnh. Hệ thống có cấu hình giám sát bằng Prometheus và Grafana. Quy trình CI kiểm tra build và chạy kiểm thử; quy trình CD triển khai theo thay đổi trên nhánh chính.

Về bảo mật, hệ thống chống chèn mã SQL nhờ truy vấn tham số hóa của R2DBC, giảm rủi ro XSS nhờ làm sạch dữ liệu ở phía giao diện, dùng JWT không lưu trạng thái, đặt reCAPTCHA ở màn hình đăng nhập và đăng ký, và có cơ chế giới hạn tần suất truy cập. Việc phân quyền ở mức phương thức bằng chú thích chưa được áp dụng và được ghi nhận là hướng phát triển.

## 4.6. Xử lý giao dịch bất đồng bộ (Reactive Transactions)

Quản lý giao dịch trong WebFlux khó hơn Spring MVC vì ngữ cảnh giao dịch không nằm trong ThreadLocal mà được truyền theo Reactor Context dọc theo chuỗi xử lý bất đồng bộ. Nhóm cấu hình một ReactiveTransactionManager dựa trên R2dbcTransactionManager và dùng chú thích @Transactional trên các phương thức service trả về Mono hoặc Flux; toàn hệ thống có hơn ba mươi phương thức mang tính giao dịch.

Nhờ đó, các thao tác gồm nhiều bước ghi cơ sở dữ liệu được cam kết hoặc hoàn tác trọn vẹn mà vẫn giữ tính không chặn luồng. Ví dụ, khi tạo một quỹ, hệ thống ghi bản ghi quỹ và bản ghi thông tin tài khoản nhận trong cùng một giao dịch; nếu một bước thất bại, toàn bộ được hoàn tác để tránh dữ liệu dở dang. Tương tự, việc tạo hội thoại kèm bản ghi thành viên hay duyệt nội dung kèm cập nhật trạng thái đều được đặt trong ranh giới giao dịch phản ứng.

[Hình 4.3: Truyền ngữ cảnh giao dịch qua Reactor Context trong một thao tác nhiều bước]
