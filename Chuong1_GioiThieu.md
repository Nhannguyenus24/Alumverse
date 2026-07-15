# CHƯƠNG 1. GIỚI THIỆU

## 1.1. Đặt vấn đề

Theo các nghiên cứu về vai trò của cựu sinh viên [1], [2], cựu sinh viên không chỉ là những người đã tốt nghiệp, mà còn có thể đóng góp trở lại cho trường ở nhiều vai trò như làm hình mẫu truyền cảm hứng cho sinh viên, cố vấn nghề nghiệp, chia sẻ chuyên môn, giới thiệu việc làm, đóng góp tài chính và góp phần xây dựng uy tín của nhà trường. Vì vậy, một hệ thống kết nối cựu sinh viên hiệu quả không chỉ giúp mọi người giữ liên lạc, mà còn giúp nhà trường khai thác được những giá trị mà các thế hệ đi trước có thể mang lại.

Tuy nhiên, phần lớn các nền tảng kết nối cựu sinh viên hiện nay được xây dựng giống như một mạng xã hội thu nhỏ, nơi người dùng chủ yếu vào xem và theo dõi thông tin nhưng rất ít khi tương tác thật sự. Thực tế quan sát tại nhiều nhóm và trang cộng đồng cựu sinh viên cho thấy số lượt tương tác trên mỗi bài đăng thường rất thấp so với quy mô thành viên. Những số liệu tham khảo này, được trình bày và phân tích chi tiết ở Chương 2, cho thấy một điểm chung là mô hình đòi hỏi người dùng phải tương tác thường xuyên như mạng xã hội không còn phù hợp với cựu sinh viên, vốn là nhóm người dùng ít khi truy cập và hiếm khi tương tác công khai.

Hệ thống AlumVerse phiên bản 2024 [3], sản phẩm của nhóm sinh viên khóa 2020 tại Trường Đại học Khoa học Tự nhiên, ĐHQG-HCM, cũng được xây dựng theo hướng này. Hệ thống tập trung vào các chức năng mang tính nội dung và giao tiếp xã hội như tin tức, sự kiện, nhóm cộng đồng, nhắn tin và diễn đàn hỏi đáp, nhưng chưa khai thác được đầy đủ vai trò mà cựu sinh viên có thể đóng góp cho nhà trường, đồng thời chưa đáp ứng nhiều nhu cầu thiết thực của sinh viên và cựu sinh viên, chẳng hạn như được cố vấn nghề nghiệp một cách có cấu trúc, kết nối cơ hội học tập và việc làm, tham gia gây quỹ minh bạch, hay trao đổi trong một diễn đàn nghề nghiệp. Về mặt kỹ thuật, hệ thống 2024 xây dựng theo kiến trúc microservices, vốn là một cách tổ chức phức tạp và tốn kém khi vận hành, không thực sự phù hợp với quy mô của một nền tảng cộng đồng, phi lợi nhuận trong trường đại học.

Một hệ thống kết nối hiệu quả còn phải phục vụ nhu cầu khác nhau của ba nhóm người dùng. Về phía nhà trường, các đơn vị quản lý ở cấp trường và cấp khoa cần quản lý dữ liệu sinh viên và cựu sinh viên một cách có hệ thống, đồng thời thống kê tỉ lệ việc làm của sinh viên tốt nghiệp để phục vụ công tác báo cáo theo quy định của Bộ Giáo dục và Đào tạo [4]. Về phía cựu sinh viên, họ có nhu cầu kết nối lại với bạn bè cũ, tham gia các sự kiện gắn kết, tìm kiếm cơ hội việc làm và học tập suốt đời. Về phía sinh viên, nhu cầu nổi bật là được hỏi đáp về việc học, định hướng lộ trình nghề nghiệp và được cố vấn. Nhiều nghiên cứu đã ghi nhận hoạt động cố vấn có tác động tích cực đến việc định hướng và chuyển tiếp nghề nghiệp của sinh viên [5]. Cùng với đó, nhu cầu tìm kiếm người cố vấn ngày càng tăng và các mô hình kết nối mentor-mentee đã trở nên phổ biến, trải rộng nhiều ngành nghề, trên cả các nền tảng quốc tế [6] lẫn các cộng đồng, nhóm nghề nghiệp tại Việt Nam [7]. Những nhu cầu này được phân tích chi tiết ở Chương 2.

Đề tài này kế thừa hệ thống AlumVerse 2024 và tập trung cải tiến hệ thống theo hai hướng song song. Một mặt, nhóm tái cấu trúc lại phần kỹ thuật để hệ thống đơn giản hơn, ổn định hơn và ít tốn chi phí hơn khi vận hành. Mặt khác, nhóm thay đổi trọng tâm của sản phẩm: thay vì cố gắng tạo ra một mạng xã hội có nhiều lượt tương tác, hệ thống tập trung vào những giá trị thiết thực mà sinh viên và cựu sinh viên thật sự cần. Những giá trị này có ích ngay cả khi người dùng chỉ thỉnh thoảng vào hệ thống, chẳng hạn như đặt lịch để được cố vấn, tìm kiếm cơ hội việc làm, hay đóng góp cho một quỹ học bổng một cách minh bạch. Nói cách khác, AlumVerse 2026 vừa khắc phục những hạn chế của phiên bản 2024, vừa đáp ứng nhu cầu khác nhau của các nhóm người dùng nêu trên. Đây là định hướng xuyên suốt của đề tài.

## 1.2. Mục tiêu đề tài

Đề tài được thực hiện dựa trên hai trụ cột chính, cũng là hai đóng góp của nhóm.

Thứ nhất là tái cấu trúc phần kỹ thuật. Nhóm chuyển hệ thống từ kiến trúc microservices (gồm 9 dịch vụ Spring Boot, dùng Eureka và API Gateway, cơ sở dữ liệu MySQL với Spring Data JPA) sang kiến trúc Modular Monolith kết hợp Layered trên nền Spring WebFlux, R2DBC và PostgreSQL. Mục tiêu là khắc phục các tính năng còn lỗi hoặc chậm, giảm độ phức tạp và hạ chi phí vận hành cho hệ thống.

Thứ hai là cải tiến về nghiệp vụ và trải nghiệm. Nhóm nâng cao trải nghiệm người dùng và bổ sung các tính năng giúp phát huy vai trò của cựu sinh viên trong trường đại học, bao gồm chương trình cố vấn có cấu trúc, cơ hội học tập và việc làm, gây quỹ minh bạch, diễn đàn hỏi đáp, trợ lý ảo, và mô hình multi-tenant cho phép nhiều khoa cùng sử dụng chung một hệ thống. Các tính năng mới được tham khảo và cải tiến từ những nền tảng thực tế tương ứng, đồng thời dựa trên các nghiên cứu về vai trò của cựu sinh viên.

Cụ thể, đề tài hướng tới các mục tiêu sau:

(1) Khảo sát nhu cầu người dùng và phân tích hiện trạng hệ thống 2024, xác định những điểm còn thiếu cần giải quyết.

(2) Thiết kế kiến trúc Modular Monolith kết hợp Layered, hỗ trợ nhiều khoa và truy cập dữ liệu theo cơ chế bất đồng bộ.

(3) Phân tích và xây dựng các tính năng theo từng nhóm nghiệp vụ, có đánh giá mức độ hoàn thành một cách rõ ràng.

(4) Phát triển ứng dụng web trên nền React và ứng dụng di động trên nền Flutter, dùng chung một hệ thống API.

(5) Kiểm thử, đánh giá hiệu năng và độ ổn định của hệ thống mới, đồng thời so sánh với hệ thống 2024.

## 1.3. Đối tượng và phạm vi nghiên cứu

Do kế thừa một hệ thống đã có sẵn người dùng, đề tài không đặt trọng tâm vào việc xác định lại đối tượng sử dụng, mà tập trung phục vụ tốt hơn các nhóm người dùng đã được xác định từ phiên bản 2024. Các nhóm này gồm sinh viên đang theo học và cựu sinh viên của Trường Đại học Khoa học Tự nhiên, cùng đội ngũ cán bộ và quản trị viên ở cấp khoa và cấp trường phụ trách quản lý nội dung, tổ chức sự kiện, xác minh danh tính và điều phối các chương trình. Ngoài ra, hệ thống vẫn phục vụ nhóm khách vãng lai (người chưa đăng nhập) với quyền truy cập giới hạn, nhằm mở rộng khả năng tiếp cận các thông tin công khai. Đối tượng nghiên cứu của đề tài là quy trình nghiệp vụ kết nối giữa sinh viên với cựu sinh viên và kiến trúc phần mềm phục vụ cho các quy trình đó.

Về phạm vi, đề tài bao gồm mã nguồn phần backend, ứng dụng web, ứng dụng di động, cơ sở dữ liệu PostgreSQL, cùng quy trình đóng gói và triển khai bằng Docker Compose và Nginx. Hệ thống được phát triển dưới dạng web đáp ứng, chạy tốt trên cả máy tính lẫn trình duyệt điện thoại, và ứng dụng di động viết bằng Flutter, cả hai dùng chung một hệ thống API. Mô hình multi-tenant được triển khai ở mức dùng chung một cơ sở dữ liệu, phân tách dữ liệu của từng khoa bằng một cột định danh tổ chức (organization_id).

Một số nội dung nằm ngoài phạm vi đề tài, bao gồm việc vận hành ở quy mô toàn trường trong môi trường thực tế, việc tách riêng dịch vụ hoặc cơ sở dữ liệu cho từng khoa, và việc chuẩn hóa hoàn toàn cơ chế phân quyền ở mức chi tiết nhất. Những nội dung này được ghi nhận là hướng phát triển trong tương lai.

## 1.4. Cấu trúc báo cáo

Phần còn lại của báo cáo được tổ chức thành năm chương. Chương 2 trình bày cơ sở lý thuyết, các công nghệ nền tảng và khảo sát hiện trạng, bao gồm phân tích hệ thống 2024, kết quả khảo sát người dùng và đề xuất hướng giải quyết. Chương 3 trình bày quá trình phân tích yêu cầu và thiết kế hệ thống, gồm tác nhân, use-case, kiến trúc, cơ sở dữ liệu và giao diện. Chương 4 mô tả quá trình triển khai, quy trình phát triển và cách xây dựng các luồng nghiệp vụ quan trọng. Chương 5 trình bày quá trình thử nghiệm và đánh giá, gồm kiểm thử chức năng, đánh giá hiệu năng và so sánh với hệ thống 2024. Cuối cùng là phần Kết luận và Hướng phát triển.
