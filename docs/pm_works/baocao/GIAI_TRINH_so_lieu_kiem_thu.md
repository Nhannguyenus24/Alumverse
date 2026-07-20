# Giải trình về số liệu kiểm thử trong Báo cáo cuối

_Soạn ngày 20/07/2026, để nhóm phản hồi góp ý của giảng viên hướng dẫn về mục "Sự tụt lùi về kiểm thử"._

---

## Tóm tắt

Nhóm xin phép **không khôi phục** con số 207 test case (165 unit + 42 integration) và 37 test case chức năng như trong bản Plan, mà giữ theo số liệu rà soát trực tiếp từ mã nguồn: **215 hàm kiểm thử đơn vị trong 21 lớp** và **15 test case chức năng được tài liệu hóa**.

Lý do không phải là nhóm thu hẹp phạm vi đánh giá, mà là các con số trong bản Plan **không có hiện vật đối chứng trong repository** tại thời điểm nộp quyển.

## Căn cứ rà soát

Rà soát được thực hiện trực tiếp trên nhánh chính, ngày 20/07/2026:

| Hạng mục | Kết quả rà soát |
|---|---|
| Số annotation `@Test` trong `backend/src/test` | 216 |
| Trong đó: unit test dùng `@ExtendWith(MockitoExtension)` | 215, thuộc 21 lớp |
| Trong đó: test nạp ngữ cảnh (`BackendApplicationTests`) | 1 |
| Lớp integration test (`@SpringBootTest` nghiệp vụ, `@DataR2dbcTest`, `@WebFluxTest`) | **0** |
| Tệp Postman collection trong repo | **không có** (chỉ có ảnh chụp màn hình `anh-postman.png`) |
| Script kiểm thử tải k6 | **không có** |
| Test tự động cho frontend web | **không có** |
| Test cho ứng dụng Flutter | chỉ có `widget_test.dart` mặc định do công cụ sinh ra |

## Vì sao chọn cách này

Nếu quyển báo cáo ghi 42 integration test trong khi repository không có lớp integration test nào, thì bất kỳ thành viên hội đồng nào mở mã nguồn cũng phát hiện ngay. Rủi ro của việc đó lớn hơn nhiều so với việc báo cáo một con số nhỏ hơn nhưng đúng. Một con số khiêm tốn có thể giải thích được, còn một con số không đối chứng được sẽ đặt dấu hỏi lên toàn bộ phần đánh giá.

Ngoài ra, báo cáo đã **không né tránh** điểm yếu này mà trình bày thẳng ở ba chỗ:

- **Mục 5.1.3** bổ sung bảng độ phủ mã nguồn đo bằng JaCoCo: Class 58%, Line 19%, Instruction 17%, Method 17%, Branch 7%, kèm phân tích nguyên nhân.
- **Mục 5.1.1** nói rõ mức kiểm thử tích hợp hiện được thực hiện thủ công trên môi trường Docker Compose chứ chưa tự động hóa.
- **Chương 6** đưa việc bổ sung kiểm thử tích hợp tự động và nâng độ phủ nhánh vào phần hạn chế và hướng phát triển.

## Nếu thầy vẫn muốn con số lớn hơn

Có một khả năng hoàn toàn chính đáng: **42 integration test có thể tồn tại dưới dạng 42 request trong Postman collection**, và **37 test case có thể nằm trong sheet theo dõi của nhóm**, chỉ là chúng không được đưa vào repository. Nếu nhóm xuất được hai hiện vật này thì con số sẽ có căn cứ và nhóm sẽ đưa ngay vào Phụ lục B:

1. Xuất Postman collection ra tệp `.json` và commit vào `backend/src/test/postman/`.
2. Xuất sheet test case ra `.csv` hoặc `.xlsx` và commit vào `docs/pm_works/`.

Khi có hai tệp này, phần kiểm thử của báo cáo có thể trình bày đủ ba mức unit, integration và system với số liệu đối chứng được, đúng như mô hình Test Pyramid trong bản Plan.

## Việc rẻ nhất nên làm trước

Độc lập với con số tổng, có hai ca kiểm thử đơn vị nên viết ngay vì chúng kiểm chứng đúng hai luận điểm kỹ thuật trọng tâm của đề tài mà hiện chưa có test nào chạm tới:

1. **Nhánh idempotent của webhook đối soát**: dựng bản ghi đóng góp đã ở trạng thái `SUCCESS`, gọi lại `processWebhook`, khẳng định `incrementDonorCountAndAmount` không được gọi. Lớp `SepayWebhookServiceTest` đã có sẵn, chỉ cần thêm một phương thức.
2. **Nhánh từ chối khi khung giờ đã được đặt**: dựng `MentorAvailability` ở trạng thái `BOOKED`, gọi `bookSession`, khẳng định nhận `ApplicationException` với mã `AVAILABILITY_NOT_AVAILABLE`. Hiện chưa có lớp `MenteeServiceTest` nào.

Hai ca này khoảng 20 dòng mỗi ca, và chúng biến hai luận điểm mạnh nhất của báo cáo từ mô tả thành bằng chứng chạy được.
