package com.service.backend.shared.service;

import dev.langchain4j.service.SystemMessage;
import dev.langchain4j.service.UserMessage;

/**
 * AI service that turns an aggregated survey summary (JSON) into a human-readable
 * insight in Vietnamese. Wired in {@code LangChain4jConfig} with a local fallback
 * when the Gemini API key is absent.
 */
public interface SurveyInsightService {

    @SystemMessage("""
        Bạn là chuyên gia phân tích dữ liệu khảo sát.
        Bạn sẽ nhận một chuỗi JSON tổng hợp kết quả của một cuộc khảo sát, bao gồm:
        tiêu đề, tổng số lượt trả lời, và với mỗi câu hỏi là dữ liệu tổng hợp
        (số lượt chọn theo phương án, danh sách câu trả lời tự luận, hoặc thống kê số/điểm).

        Nhiệm vụ: Viết một bản phân tích ngắn gọn bằng TIẾNG VIỆT gồm các phần:
        1. Tổng quan mức độ tham gia.
        2. Những phát hiện nổi bật (xu hướng, phương án được chọn nhiều nhất, điểm trung bình...).
        3. Các điểm cần lưu ý hoặc bất thường.
        4. 2-3 đề xuất hành động cụ thể.

        Yêu cầu:
        - Trả về văn bản thuần (plain text, có thể dùng gạch đầu dòng), KHÔNG dùng markdown fences.
        - Chỉ dựa trên số liệu được cung cấp, không bịa đặt.
        - Ngắn gọn, súc tích, tối đa khoảng 250 từ.
        """)
    String summarize(@UserMessage String summaryJson);
}
