# CHƯƠNG 2. CƠ SỞ LÝ THUYẾT VÀ KHẢO SÁT HIỆN TRẠNG

Chương này trình bày cơ sở lý thuyết và công nghệ nền tảng cho các quyết định kỹ thuật của đề tài, phân tích nhu cầu các nhóm người dùng, khảo sát và định vị tính năng so với các hệ thống liên quan, và phân tích hiện trạng hệ thống AlumVerse 2024. Trên cơ sở đó, chương đề xuất định hướng giải pháp cho phiên bản 2026.

## 2.1. Cơ sở lý thuyết và công nghệ nền tảng

### 2.1.1. Tái thiết kế và xử lý nợ kỹ thuật (Re-engineering & Technical Debt)

Nợ kỹ thuật (technical debt) là phần chi phí phát sinh trong tương lai do các lựa chọn thiết kế thiên về giải pháp nhanh trước mắt thay vì giải pháp bền vững lâu dài [8], [9]. Ở hệ thống AlumVerse 2024, nợ kỹ thuật đến từ việc chia tách Microservices quá sớm, gây phụ thuộc phức tạp giữa các thành phần và chi phí vận hành cao.

Đánh giá hiện trạng cho thấy sửa đổi trực tiếp trên mã nguồn cũ tốn thời gian hơn xây dựng mới và khó xử lý triệt để nút thắt hiệu năng. Nhóm chọn chiến lược phát triển mới hoàn toàn (System Rewrite). Nhóm không có mã nguồn của hệ thống cũ, nhưng kế thừa toàn bộ tài liệu phân tích và thiết kế trong báo cáo 2024 [3], gồm thiết kế tính năng, thiết kế hệ thống, kiến trúc nghiệp vụ và cấu trúc cơ sở dữ liệu. Trên nền tảng đó, nhóm xây dựng mã nguồn mới và cơ sở dữ liệu mới trên PostgreSQL, kế thừa cấu trúc cũ và mở rộng cho các module mới. Hệ thống được tổ chức theo kiến trúc Modular Monolith, chuẩn hóa cách truyền dữ liệu giữa các tầng, và chuyển hoàn toàn sang cơ chế truy cập dữ liệu bất đồng bộ.

Như vậy, mục tiêu "tái cấu trúc" (refactoring) trong tên đề tài được hiểu ở cấp kiến trúc hệ thống, tức tái thiết kế toàn bộ hệ thống để loại bỏ nợ kỹ thuật, và được hiện thực hóa bằng chiến lược phát triển mới thay vì sửa đổi tăng dần trên mã nguồn cũ.

### 2.1.2. Kiến trúc Modular Monolith và Layered

Microservices [10] chia một ứng dụng thành nhiều dịch vụ nhỏ, độc lập, giao tiếp qua mạng. Cách tổ chức này phù hợp với hệ thống quy mô rất lớn nhưng làm tăng độ phức tạp khi triển khai, giám sát và gỡ lỗi ở dự án quy mô vừa.

Modular Monolith giữ hệ thống là một ứng dụng duy nhất khi triển khai, bên trong chia thành các module nghiệp vụ tách biệt. Kết hợp với kiến trúc Layered [11], mỗi module được tổ chức theo các lớp controller, service, dao, entity và dto. Cách này vẫn tách bạch trách nhiệm nhưng đơn giản hơn Microservices về mặt vận hành.

Đề cương ban đầu dự kiến áp dụng Clean Architecture [12] với các tầng use-case, port và adapter. Thực tế triển khai cho thấy chi phí ánh xạ dữ liệu giữa các tầng và chi phí viết kiểm thử tăng đáng kể so với lợi ích ở quy mô đề tài. Nhóm điều chỉnh sang Modular Monolith kết hợp Layered, phù hợp với nguồn lực và tiến độ mà vẫn bảo đảm khả năng bảo trì và mở rộng. Quyết định này được ghi nhận trong Báo cáo tiến độ.

### 2.1.3. Reactive Programming

Mô hình lập trình phản ứng được đặc trưng bởi bốn tính chất: phản hồi nhanh, có khả năng phục hồi, co giãn theo tải và hướng thông điệp [13]. Spring WebFlux hiện thực mô hình này qua thư viện Project Reactor với hai kiểu dữ liệu Mono và Flux, xử lý yêu cầu bất đồng bộ và không chặn luồng. R2DBC truy cập cơ sở dữ liệu quan hệ theo cùng cơ chế, thay cho kết nối đồng bộ truyền thống.

Cơ chế không chặn luồng cho phép hệ thống phục vụ nhiều kết nối đồng thời, như luồng nhắn tin thời gian thực hay luồng phản hồi của trợ lý ảo, với ít luồng xử lý. WebFlux và R2DBC giúp giảm nút thắt tài nguyên khi số kết nối tăng cao, điều mà mô hình chặn luồng của AlumVerse 2024 khó đáp ứng. Đổi lại, mô hình này có chi phí học tập và gỡ lỗi cao hơn.

### 2.1.4. Kiến trúc Multi-tenant

Một hệ thống phục vụ nhiều đơn vị trên cùng nền tảng có ba cách tổ chức dữ liệu [14]: mỗi đơn vị một cơ sở dữ liệu riêng; dùng chung cơ sở dữ liệu nhưng mỗi đơn vị một lược đồ riêng; hoặc dùng chung cơ sở dữ liệu và lược đồ, phân biệt dữ liệu bằng một cột định danh. Ba cách thể hiện sự đánh đổi giữa mức độ cô lập dữ liệu và chi phí vận hành.

AlumVerse chọn cách thứ ba, phân tách dữ liệu của từng khoa bằng cột organization_id. Frontend nhận diện tổ chức qua slug hoặc tên miền phụ; backend gắn định danh tổ chức vào thông tin xác thực và lọc dữ liệu theo phạm vi khoa. Cách này phù hợp với quy mô đề tài, chấp nhận mức cô lập thấp hơn để đơn giản khi vận hành.

## 2.2. Phân tích nhu cầu các nhóm người dùng

### 2.2.1. Vai trò của cựu sinh viên

Các nghiên cứu về vai trò của cựu sinh viên [1], [2] xác định nhiều vai trò: hình mẫu truyền cảm hứng, cố vấn nghề nghiệp, đóng góp chuyên môn, hỗ trợ phát triển nghề nghiệp cho thế hệ sau, tham gia tuyển dụng, đóng góp tài chính và xây dựng uy tín nhà trường. Các vai trò này là cơ sở xác định những nhóm tính năng hướng giá trị của AlumVerse, thay vì chỉ dừng ở chức năng tương tác xã hội.

### 2.2.2. Nhu cầu nhóm quản trị

Cấp trường và cấp khoa cần công cụ quản lý hồ sơ sinh viên và cựu sinh viên có hệ thống, xác minh danh tính và phân nhóm theo khoa, theo khóa. Thống kê tỉ lệ việc làm sau tốt nghiệp là nhu cầu có cơ sở pháp lý: quy định của Bộ Giáo dục và Đào tạo yêu cầu các trường khảo sát, công khai và báo cáo tình hình việc làm của sinh viên sau một năm tốt nghiệp, nộp trước ngày 31 tháng 12 hằng năm, làm căn cứ xác định chỉ tiêu tuyển sinh [4]. Nhà trường cũng cần kênh chính thức để đăng tin tức, tổ chức sự kiện, vinh danh thành tích và tiếp nhận gây quỹ minh bạch.

### 2.2.3. Nhu cầu nhóm cựu sinh viên

Cựu sinh viên có nhu cầu kết nối lại với bạn bè cũ, ôn lại kỷ niệm và mở rộng quan hệ nghề nghiệp. Họ cũng mong muốn tham gia các sự kiện gắn kết định kỳ, đôi khi đi kèm mô hình hội viên có thu phí và quyền lợi tương ứng. Chương trình RMIT Active Hub của Trường Đại học RMIT Việt Nam là một ví dụ: cựu sinh viên đóng phí theo học kỳ để sử dụng cơ sở vật chất, dịch vụ và câu lạc bộ, qua đó duy trì kết nối với trường (Hình 2.1) [15].

[Hình 2.1: Trang quyền lợi hội viên của chương trình RMIT Active Hub (tham khảo mô hình hội viên)]

Mô hình hội viên trả phí gắn với cơ sở vật chất phù hợp với các trường có hạ tầng lớn và khó áp dụng cho phần lớn trường đại học công lập tại Việt Nam. Ở các trường công lập, hoạt động gắn kết cựu sinh viên chủ yếu xoay quanh các sự kiện gặp mặt. Tại Khoa Công nghệ Thông tin, Trường Đại học Khoa học Tự nhiên (FIT@HCMUS), các hoạt động này gồm ngày hội cựu sinh viên, giải thể thao truyền thống, câu lạc bộ cựu sinh viên, các buổi seminar chia sẻ kinh nghiệm và quỹ học bổng hỗ trợ sinh viên (Hình 2.2) [16]. AlumVerse hướng theo mô hình này và phục vụ các nhu cầu đó qua module sự kiện, mạng lưới kết nối, cố vấn và gây quỹ, thay vì mô hình hội viên trả phí.

[Hình 2.2: Trang hoạt động cựu sinh viên của FIT@HCMUS: ngày hội cựu sinh viên, câu lạc bộ và quỹ học bổng]

Cựu sinh viên cũng quan tâm đến cơ hội việc làm, giới thiệu việc làm và học tập suốt đời thông qua chia sẻ kỹ năng, khóa học và thông tin học sau đại học.

### 2.2.4. Nhu cầu nhóm sinh viên

Sinh viên cần được hỏi đáp về học tập, lộ trình nghề nghiệp và được cố vấn. Một tổng quan hệ thống trên 73 nghiên cứu cho thấy hoạt động cố vấn tác động tích cực đến việc lựa chọn nghề nghiệp và quá trình chuyển tiếp từ học tập sang làm việc [5].

Mô hình kết nối người cố vấn với người được cố vấn đã phổ biến và đa dạng ngành nghề. Ở phạm vi quốc tế, ADPList có hơn 40.000 người cố vấn trên 140 quốc gia (Hình 2.3) [6]. Tại Việt Nam, mô hình này vận hành qua nhiều cộng đồng và nền tảng [7], trong đó Mentori.vn (Hình 2.4) có cách tổ chức luồng cố vấn gần với thiết kế mà nhóm hướng tới. AlumVerse tham khảo ADPList về quy mô và trải nghiệm, nhưng kế thừa mô hình nghiệp vụ của Mentori.vn nhiều hơn. Khoảng trống kỹ năng cũng cho thấy nhu cầu này: một khảo sát trên hơn 3.000 sinh viên ghi nhận 42% sinh viên chưa có việc làm do chưa đáp ứng yêu cầu tuyển dụng, và 61% sinh viên đã đi làm tự nhận còn thiếu kỹ năng chuyên môn [17].

[Hình 2.3: Giao diện nền tảng ADPList (tham khảo về quy mô và trải nghiệm)]

[Hình 2.4: Giao diện nền tảng Mentori.vn (tham khảo chính cho thiết kế luồng Mentorship)]

### 2.2.5. Khảo sát nhu cầu người dùng

Nhóm thực hiện một khảo sát trực tuyến với sinh viên và cựu sinh viên, thu 90 phản hồi hợp lệ. Về nơi học, 74 người tham gia học tại các trường thuộc Đại học Quốc gia Thành phố Hồ Chí Minh, số còn lại đến từ các trường khác trong và ngoài nước. Về vai trò, mẫu gồm 55 sinh viên năm ba và năm tư, 19 sinh viên năm nhất và năm hai, 16 cựu sinh viên. Do mẫu nhỏ, nghiêng về sinh viên và không thuần một trường, kết quả được dùng như một khảo sát thăm dò định hướng, không suy rộng thống kê.

[Bảng 2.1: Mức độ quan tâm theo nhóm nhu cầu (thang 1 đến 5), N = 90]

[Hình 2.5: Biểu đồ mức độ quan tâm của sinh viên năm ba và năm tư, N = 55]

Ở nhóm sinh viên năm ba và năm tư, hai hạng mục được quan tâm nhất là kết nối cơ hội nghề nghiệp và tìm người cố vấn trong ngành; khoảng 85% mong muốn tham gia hoạt động cố vấn. Nổi bật là sự lệch cung cầu: nhu cầu được cố vấn của sinh viên rất cao, nhưng phần lớn cựu sinh viên còn dè dặt khi được hỏi về khả năng làm người cố vấn. Đây là căn cứ để thiết kế các tính năng giảm rào cản cho người cố vấn, như lưu nháp hồ sơ, gợi ý kỹ năng tự động và quản lý lịch linh hoạt. Người tham gia cũng dè dặt khi cung cấp giấy tờ tùy thân, nên quy trình xác minh cho phép che bớt thông tin nhạy cảm.

## 2.3. Khảo sát các hệ thống liên quan và định vị tính năng

### 2.3.1. Các nền tảng cựu sinh viên tiền lệ

Kế thừa khảo sát của báo cáo 2024 [3], nhóm xem xét vài nền tảng tiêu biểu. BKA Alumni giàu tính năng tương tác kiểu mạng xã hội nhưng thiếu mục vinh danh cựu sinh viên. RMIT Vietnam Alumni cho đăng ký sự kiện và có mục tư vấn nhưng chỉ phát triển trên web và hạn chế tương tác. IoBM Alumni có tìm việc và tạo story nhưng thiếu tin tức, vinh danh. Oxford Alumni cho đăng ký sự kiện và tham gia nhóm nhưng cũng chỉ có trên web.

### 2.3.2. So sánh tính năng theo nhóm với nền tảng tham khảo

Mỗi nhóm tính năng mới của AlumVerse được tham khảo và cải tiến từ một hoặc vài nền tảng thực tế. Bảng 2.2 tổng hợp ánh xạ chung; các hình và bảng tiếp theo so sánh chi tiết từng nhóm.

[Bảng 2.2: Ánh xạ nhóm tính năng AlumVerse với nền tảng tham khảo và vai trò cựu sinh viên]

Cố vấn (Mentorship). Nhóm tham khảo Mentori.vn và ADPList (Hình 2.3, Hình 2.4). Luồng đăng ký hồ sơ, ghép cặp, đặt lịch và phản hồi được thiết kế bám sát Mentori.vn.

[Bảng 2.3: So sánh tính năng Cố vấn giữa Mentori.vn, ADPList và AlumVerse]

Gây quỹ (Fundraising). Nhóm tham khảo UEH Alumni và GlobalGiving về trang chiến dịch và minh bạch đóng góp.

[Hình 2.6: Giao diện nền tảng gây quỹ tham khảo]

[Bảng 2.4: So sánh tính năng Gây quỹ giữa nền tảng tham khảo và AlumVerse]

Diễn đàn nghề nghiệp (Forum). Nhóm tham khảo các cộng đồng chuyên môn và diễn đàn hỏi đáp theo chủ đề.

[Hình 2.7: Giao diện diễn đàn tham khảo]

[Bảng 2.5: So sánh tính năng Diễn đàn giữa nền tảng tham khảo và AlumVerse]

Sự kiện (Events). Nhóm tham khảo mô hình sự kiện gặp mặt cựu sinh viên như của FIT@HCMUS (Hình 2.2) và các nền tảng vé điện tử, đăng ký tham dự.

[Bảng 2.6: So sánh tính năng Sự kiện giữa nền tảng tham khảo và AlumVerse]

Cơ hội học tập và việc làm (Jobs & Learning). Nhóm tham khảo cổng việc làm và nền tảng học liệu trực tuyến.

[Hình 2.8: Giao diện cổng việc làm và học liệu tham khảo]

[Bảng 2.7: So sánh tính năng Học tập và Việc làm giữa nền tảng tham khảo và AlumVerse]

### 2.3.3. Mô hình mạng xã hội thuần tuý và mô hình hướng giá trị

Đặc điểm chung của các nền tảng vận hành kiểu mạng xã hội là tỉ lệ tương tác thực chất trên mỗi bài đăng rất thấp so với quy mô thành viên. Bảng 2.8 tổng hợp quan sát về vài cộng đồng cựu sinh viên, cho thấy tỉ lệ tương tác ước lượng rất nhỏ. Đây là số liệu quan sát của các cộng đồng khác, dùng minh họa xu hướng chung, không phải số liệu của AlumVerse.

[Bảng 2.8: Tỉ lệ tương tác ước lượng của vài cộng đồng cựu sinh viên (số liệu quan sát, mang tính minh họa)]

Nguyên tắc thiết kế cốt lõi rút ra là: thay vì theo đuổi lượng tương tác thường xuyên, AlumVerse tập trung vào giá trị thiết thực, có ích ngay cả khi người dùng truy cập không thường xuyên, như đặt lịch cố vấn, tìm cơ hội việc làm hay đóng góp quỹ. Theo nguyên tắc này, nhắn tin và diễn đàn đóng vai trò công cụ hỗ trợ cho hoạt động cố vấn và kết nối nghề nghiệp, không phải mục đích cuối. Người dùng phải được chấp nhận yêu cầu kết nối trước khi nhắn tin riêng; diễn đàn tổ chức theo chủ đề nghề nghiệp thay vì dòng thời gian tự do. Giới hạn này phân biệt AlumVerse với một mạng xã hội công cộng.

## 2.4. Phân tích hệ thống AlumVerse 2024

### 2.4.1. Kiến trúc và công nghệ

Theo báo cáo 2024 [3], hệ thống dùng kiến trúc Microservices với chín dịch vụ Spring Boot, đăng ký dịch vụ qua Eureka và định tuyến qua API Gateway. Web dùng Next.js, di động dùng Flutter. Cơ sở dữ liệu là MySQL với Spring Data JPA; ảnh lưu trên Google Cloud Storage; thông báo đẩy qua Firebase Cloud Messaging.

[Hình 2.9: Sơ đồ kiến trúc Microservices của AlumVerse 2024]

[Bảng 2.9: So sánh kiến trúc và công nghệ giữa AlumVerse 2024 và phiên bản 2026]

### 2.4.2. Phạm vi chức năng và mô hình dữ liệu

Bảng so sánh chức năng trong báo cáo 2024 liệt kê chín tính năng cốt lõi: đa nền tảng, quản lý vai trò và phân quyền, đăng ký sự kiện, gương thành công, tư vấn và cố vấn, tạo nhóm, đăng bài trong nhóm, nhắn tin, tìm kiếm cựu sinh viên. Toàn bộ thuộc nhóm nội dung và kết nối xã hội, chưa có tính năng tạo giá trị nghề nghiệp hay tài chính đo lường được. Tính năng tư vấn và cố vấn chỉ ở mức một bài đăng kèm bình chọn và bình luận, chưa có đặt lịch hẹn hay theo dõi tiến độ.

Lược đồ dữ liệu 2024 tổ chức quanh tám nhóm thực thể: người dùng, vai trò, tin tức, sự kiện, gương thành công, tư vấn, nhóm, nhắn tin. Không có nhóm bảng nào dành cho gây quỹ, việc làm hay học liệu.

[Hình 2.10: Các nhóm thực thể trong lược đồ cơ sở dữ liệu AlumVerse 2024]

### 2.4.3. Nợ kỹ thuật và hạn chế vận hành

Báo cáo 2024 [3] ghi nhận thời gian phản hồi máy chủ khi triển khai trực tuyến chậm, khoảng sáu giây mỗi lượt gọi lấy danh sách, do khó triển khai Microservices và phải chọn khu vực máy chủ ở xa. Hệ thống chưa có kiểm thử tự động và chỉ hỗ trợ nhắn tin cá nhân, chưa có nhắn tin nhóm. Các hạn chế này là động lực trực tiếp cho hai trụ cột tái thiết kế và cải tiến của phiên bản 2026.

### 2.4.4. Tính năng kế thừa và loại bỏ có chủ đích

Phiên bản 2026 kế thừa các luồng đã kiểm chứng, gồm tin tức, sự kiện, nhắn tin và xác minh cựu sinh viên, đồng thời thực hiện vài thay đổi có chủ đích. Nhóm cộng đồng kèm bài đăng được thay bằng diễn đàn có cấu trúc kết hợp mạng lưới kết nối. Cơ chế tạo và sửa vai trò qua giao diện được thay bằng tập vai trò cố định gắn định danh tổ chức; ở quy mô một nền tảng cựu sinh viên, đây là lựa chọn giảm độ phức tạp, không phải thiếu sót. Thông báo đẩy qua dịch vụ ngoài được đổi thành thông báo trong ứng dụng.

## 2.5. Khoảng trống và đề xuất định hướng giải pháp

Từ phân tích nhu cầu, khảo sát hệ thống liên quan và hiện trạng bản 2024, nhóm xác định bốn định hướng cho phiên bản 2026. Thứ nhất, giữ và hoàn thiện các luồng đã kiểm chứng. Thứ hai, đơn giản hóa kiến trúc để giảm chi phí vận hành, bằng Modular Monolith kết hợp Layered trên nền Reactive Programming. Thứ ba, bổ sung các nhóm tính năng tạo giá trị: cố vấn có cấu trúc, cơ hội học tập và việc làm, gây quỹ minh bạch, diễn đàn nghề nghiệp, trợ lý ảo và Multi-tenant. Thứ tư, chuẩn hóa danh mục tính năng làm căn cứ đánh giá mức độ hoàn thành.

Danh mục tính năng phiên bản 2026 gồm khoảng 105 tính năng thuộc 14 nhóm module, bao gồm cả luồng kế thừa và nhóm tính năng mới; phần lớn đã hoàn thiện, một số đang hoàn thiện và một số ít chưa bắt đầu. Bảng 2.10 tóm tắt các nhóm tính năng mới cùng nguồn tham khảo và trạng thái hiện thực; minh họa giao diện và chi tiết triển khai ở Chương 3 và Chương 4, số liệu đánh giá mức độ hoàn thành ở Chương 5.

[Bảng 2.10: Các nhóm tính năng mới của AlumVerse 2026, nguồn tham khảo và trạng thái hiện thực]

Định hướng đơn giản hóa kiến trúc đi kèm các thực hành bảo đảm chất lượng, gồm kiểm thử tự động cho tầng nghiệp vụ, tích hợp và triển khai liên tục, và giám sát vận hành; các nội dung này được trình bày ở Chương 4 và Chương 5.

Nguyên tắc xuyên suốt là thiết kế hướng giá trị: tập trung vào giá trị thiết thực, có ích ngay cả khi người dùng truy cập không thường xuyên, thay vì chạy theo lượng tương tác của mô hình mạng xã hội. Các định hướng này được cụ thể hóa thành yêu cầu và thiết kế trong Chương 3.
