# CHƯƠNG 5. THỬ NGHIỆM VÀ ĐÁNH GIÁ

Chương này trình bày chiến lược và kết quả kiểm thử, đánh giá mức độ hoàn thành theo module, đánh giá hiệu năng, đối chiếu với hệ thống 2024, kiểm chứng cô lập dữ liệu đa đơn vị, và đánh giá phi chức năng cùng bài học kinh nghiệm.

## 5.1. Chiến lược và môi trường kiểm thử

Nhóm áp dụng nhiều mức kiểm thử. Kiểm thử hộp đen theo luồng người dùng được thực hiện cho từng tính năng trong danh mục. Các API được kiểm thử qua Swagger và Postman. Các tích hợp đặc biệt như webhook Sepay, WebSocket và luồng SSE được kiểm thử thủ công. Ứng dụng di động được kiểm thử trên trình giả lập và thiết bị thật.

Ở mức kiểm thử tự động, backend có khoảng 196 hàm kiểm thử đơn vị cho tầng nghiệp vụ, chia thành 21 lớp kiểm thử, sử dụng JUnit 5, Mockito và StepVerifier để kiểm thử luồng bất đồng bộ. Frontend chưa có kiểm thử tự động, và nội dung này được ghi nhận là hướng phát triển. Môi trường kiểm thử được dựng bằng Docker Compose gồm PostgreSQL và Nginx.

## 5.2. Kết quả kiểm thử chức năng

Nhóm xây dựng bộ test case chức năng và kịch bản kiểm thử chấp nhận bám theo luồng người dùng, gồm khoảng 37 test case chức năng và 14 kịch bản kiểm thử chấp nhận được tài liệu hóa trong danh mục theo dõi. Kết quả kiểm thử được ghi nhận theo từng test case; danh sách chi tiết trình bày ở Phụ lục B.

[Bảng 5.1: Tóm tắt test case theo nhóm module]

## 5.3. Đánh giá mức độ hoàn thành theo module

Danh mục gồm khoảng 105 tính năng, trong đó 64 tính năng đã hoàn thiện, 31 tính năng đang hoàn thiện và 8 tính năng chưa bắt đầu. Mức độ hoàn thành được đánh giá theo từng module trên ba nền tảng backend, frontend và mobile, dựa trên bằng chứng từ mã nguồn. Phần lớn module đạt mức cao ở backend và frontend; module trợ lý ảo còn thấp ở backend và là hạng mục cần hoàn thiện. Các con số hoàn thành được hiểu theo phạm vi tính năng đã đặc tả, không phải mức độ phủ kiểm thử tự động.

[Bảng 5.2: Mức độ hoàn thành theo module (backend, frontend, mobile)]

## 5.4. Đánh giá hiệu năng và tính ổn định

Nhóm đánh giá hiệu năng bằng kịch bản kiểm thử tải, dùng công cụ kiểm thử tải chuyên dụng (k6), mô phỏng số người dùng đồng thời tăng dần từ vài trăm đến khoảng một nghìn, đo thời gian phản hồi ở phân vị p50 và p95, thông lượng, tỉ lệ lỗi, số kết nối WebSocket đồng thời và độ trễ của luồng SSE.

Nhóm không có mã nguồn của bản 2024 mà chỉ có báo cáo và thiết kế, nên không thể dựng lại và đo trực tiếp bản 2024. Vì vậy, đề tài không thực hiện so sánh hiệu năng đối đầu giữa hai phiên bản. Thay vào đó, nhóm đo hiệu năng của bản 2026 trên một tiêu chuẩn phần cứng được ghi rõ, gồm đóng gói bằng Docker với giới hạn CPU và bộ nhớ xác định cùng một bộ dữ liệu mẫu cố định, và trình bày kết quả này như số liệu độc lập của phiên bản mới. Việc cố định cấu hình và dữ liệu giúp kết quả có thể tái lập và so sánh được giữa các lần chạy của bản 2026.

Con số khoảng sáu giây cho mỗi lượt gọi lấy danh sách trong báo cáo 2024 chỉ được nêu như một tham chiếu định tính về hiện trạng cũ, kèm lưu ý rằng nó được đo trong môi trường khác và không thể tái lập. Việc đối chiếu định lượng trực tiếp giữa hai phiên bản do đó nằm ngoài phạm vi; so sánh giữa hai kiến trúc được thực hiện ở mức định tính trong mục 5.5.

[Bảng 5.3: Kết quả kiểm thử tải (thời gian phản hồi p50, p95 theo mức tải)]

[Hình 5.1: Biểu đồ thời gian phản hồi theo số người dùng đồng thời]

## 5.5. Đánh giá đối chiếu với hệ thống 2024

Phiên bản 2026 được đối chiếu với bản 2024 trên hai phương diện kiến trúc và nghiệp vụ. Về kiến trúc, mô hình chín dịch vụ nhỏ được thay bằng một ứng dụng nguyên khối phân module, giúp giảm chi phí triển khai và vận hành ở quy mô đề tài. Về nghiệp vụ, tính năng tư vấn dạng bài đăng được thay bằng chương trình cố vấn có cấu trúc với đặt lịch và phản hồi, hệ thống chuyển từ phục vụ một đơn vị sang mô hình đa đơn vị, và bổ sung các nhóm tính năng tạo giá trị mới.

[Bảng 5.4: So sánh tổng quan AlumVerse 2024 và phiên bản 2026]

## 5.6. Kiểm chứng cô lập dữ liệu đa đơn vị

Nhóm kiểm chứng cơ chế cô lập dữ liệu bằng các kịch bản trên nhiều tổ chức. Khi một người dùng thuộc một khoa đăng nhập, hệ thống chỉ trả về dữ liệu của khoa đó, gồm tin tức, sự kiện, diễn đàn và danh sách cố vấn, nhờ điều kiện lọc theo organization_id. Kết quả cho thấy dữ liệu giữa các khoa được tách biệt đúng phạm vi.

[Bảng 5.5: Kịch bản và kết quả kiểm chứng cô lập dữ liệu theo organization_id]

## 5.7. Đánh giá mức độ tương tác thực tế

Để đánh giá giá trị thực tế, nhóm tổ chức thử nghiệm chấp nhận với một nhóm người dùng gồm sinh viên và cựu sinh viên trong một khoảng thời gian ngắn, kết hợp dữ liệu mẫu. Các chỉ số được quan tâm gồm số lượng đăng ký tài khoản, số lịch hẹn cố vấn được tạo, mức độ sử dụng diễn đàn và sự kiện. Do phạm vi đề tài, đây là thử nghiệm chấp nhận có kiểm soát, không phải số liệu vận hành ở quy mô toàn trường.

[Bảng 5.6: Kết quả thử nghiệm chấp nhận với nhóm người dùng]

Bên cạnh các chỉ số sử dụng, nhóm đo một số chỉ số nghiệp vụ phản ánh giá trị thực của hệ thống, thay vì chỉ đo thời gian phản hồi. Các chỉ số này gồm tỉ lệ đặt lịch cố vấn thành công trên tổng số yêu cầu, thời gian trung bình từ lúc người dùng chuyển khoản đến khi khoản đóng góp được ghi nhận thành công qua webhook, và số chủ đề cùng lượt trả lời trên diễn đàn nghề nghiệp. Đây là các chỉ số cho thấy hệ thống tạo ra giá trị giao dịch cụ thể, khác với các chỉ số tương tác thuần túy của mô hình mạng xã hội đã phân tích ở Chương 1 và Chương 2. Việc đo lường theo hướng này giúp chứng minh phần cải tiến giá trị (enhancing) chứ không chỉ dừng ở cải thiện hiệu năng kỹ thuật.

[Bảng 5.7: Các chỉ số nghiệp vụ đo lường giá trị (tỉ lệ đặt lịch cố vấn thành công, thời gian xử lý một giao dịch gây quỹ, mức độ hoạt động diễn đàn)]

## 5.8. Đánh giá phi chức năng và bài học kinh nghiệm

Trên phương diện phi chức năng, hệ thống đạt yêu cầu về hiệu năng nhờ kiến trúc bất đồng bộ, có các cơ chế bảo mật cơ bản, hỗ trợ đa đơn vị ở mức chia sẻ cơ sở dữ liệu, có giao diện đáp ứng trên web và di động, và có tính bảo trì tốt nhờ tổ chức module cùng kiểm thử tự động cho tầng nghiệp vụ. Một số hạn chế còn lại gồm chưa chuẩn hóa phân quyền ở mức phương thức, chưa có kiểm thử tự động cho frontend, và một vài tính năng còn ở mức một phần hoặc sơ khai.

Qua quá trình thực hiện, nhóm rút ra một số bài học: lấy mã nguồn làm căn cứ chính khi viết tài liệu; duy trì một danh mục tính năng thống nhất để đồng bộ nhóm; chọn kiến trúc phù hợp quy mô thay vì áp dụng mô hình phức tạp; đầu tư kiểm thử tự động sớm; và kiểm soát chặt phạm vi khi thay đổi nền tảng phát triển.
