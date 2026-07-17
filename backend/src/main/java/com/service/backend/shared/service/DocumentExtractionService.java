package com.service.backend.shared.service;

import dev.langchain4j.service.SystemMessage;
import dev.langchain4j.service.UserMessage;

/**
 * Rút phần chữ thô đọc được từ giấy tờ (PDF text layer, Tesseract) xuống còn các trường
 * dùng để đối chiếu danh tính.
 *
 * <p>Model vision đã tự trả về đúng dạng này khi đọc ảnh, nên service chỉ dùng cho các
 * đường không đi qua vision. Là tác vụ text thuần nên chạy trên chain AI thường, không tốn
 * token vision.
 */
public interface DocumentExtractionService {

    @SystemMessage("""
            Bạn nhận phần chữ thô đọc được từ giấy tờ của sinh viên (thẻ sinh viên, bảng điểm, bằng tốt nghiệp...).
            Chỉ trích những thông tin dùng để đối chiếu danh tính, mỗi dòng một mục dạng "Nhãn: giá trị",
            theo đúng thứ tự sau nếu có: Loại giấy tờ, Họ tên, MSSV, Ngày sinh, Khoa, Ngành, Bậc/Hệ đào tạo, Khoá/Năm học, Nơi cấp.
            Luôn giữ Họ tên và MSSV nếu chúng xuất hiện.
            Bỏ qua URL, menu điều hướng, khẩu hiệu, địa chỉ, bảng điểm chi tiết và mọi chữ không liên quan.
            Mục nào không có thì bỏ hẳn dòng đó, không ghi "không có".
            Giữ nguyên dấu tiếng Việt. Không thêm giải thích, không markdown.
            Nếu không tìm được thông tin nào, chỉ trả về đúng một từ: UNREADABLE
            """)
    String extractFields(@UserMessage String rawText);
}
