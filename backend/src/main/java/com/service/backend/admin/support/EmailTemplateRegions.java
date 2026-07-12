package com.service.backend.admin.support;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import com.service.backend.admin.dto.EmailTemplateEditableRegion;

/**
 * Trích/ghép các "vùng sửa được" trong nội dung email template.
 *
 * <p>Ý tưởng: nội dung template vẫn là HTML đầy đủ (giữ nguyên layout, CSS, binding Thymeleaf) —
 * chỉ những đoạn văn bản an toàn được bọc trong comment đánh dấu để admin non-tech chỉnh sửa mà
 * không đụng tới phần kỹ thuật. Vì đây là comment HTML thường nên khi render/gửi email chúng vô
 * hình với người nhận, không ảnh hưởng pipeline hiện tại.
 *
 * <p>Cú pháp marker:
 * <pre>{@code
 * <!--#region key="greeting" label="Lời chào" type="html"-->Xin chào bạn!<!--#endregion-->
 * }</pre>
 * {@code type} là {@code text} (một dòng, hiển thị bằng ô nhập thường) hoặc {@code html}
 * (nhiều dòng, hiển thị bằng trình soạn rich-text). Mặc định {@code html} nếu thiếu.
 */
public final class EmailTemplateRegions {

    /** Bắt trọn một vùng: nhóm 1 = thuộc tính ở marker mở, nhóm 2 = nội dung bên trong. */
    private static final Pattern REGION =
            Pattern.compile("<!--#region\\s+(.*?)-->(.*?)<!--#endregion-->", Pattern.DOTALL);

    private static final Pattern ATTR = Pattern.compile("(\\w+)\\s*=\\s*\"([^\"]*)\"");

    private EmailTemplateRegions() {
    }

    /** Nội dung có chứa vùng sửa được hay không (để frontend chọn chế độ hiển thị). */
    public static boolean hasRegions(String content) {
        return content != null && REGION.matcher(content).find();
    }

    /** Trích danh sách vùng sửa được theo đúng thứ tự xuất hiện trong template. */
    public static List<EmailTemplateEditableRegion> extract(String content) {
        List<EmailTemplateEditableRegion> regions = new ArrayList<>();
        if (content == null) {
            return regions;
        }
        Matcher m = REGION.matcher(content);
        while (m.find()) {
            Map<String, String> attrs = parseAttributes(m.group(1));
            String key = attrs.get("key");
            if (key == null || key.isBlank()) {
                continue;
            }
            String type = normalizeType(attrs.get("type"));
            String label = attrs.getOrDefault("label", key);
            String value = m.group(2);
            regions.add(new EmailTemplateEditableRegion(
                    key, label, type, "text".equals(type) ? unescape(value) : value));
        }
        return regions;
    }

    /**
     * Ghép giá trị mới cho từng vùng vào lại nội dung gốc, giữ nguyên marker và toàn bộ phần khóa
     * (layout/CSS/binding). Chỉ thay các key có trong {@code values}; key vắng mặt giữ nguyên.
     * Vùng {@code text} được escape HTML để admin gõ ký tự {@code < > &} không phá vỡ template.
     */
    public static String apply(String content, Map<String, String> values) {
        if (content == null || values == null || values.isEmpty()) {
            return content;
        }
        Matcher m = REGION.matcher(content);
        StringBuilder out = new StringBuilder();
        while (m.find()) {
            Map<String, String> attrs = parseAttributes(m.group(1));
            String key = attrs.get("key");
            String replacement = m.group(0);
            if (key != null && values.containsKey(key)) {
                String type = normalizeType(attrs.get("type"));
                String raw = values.get(key) != null ? values.get(key) : "";
                String inner = "text".equals(type) ? escape(raw) : raw;
                replacement = "<!--#region " + m.group(1) + "-->" + inner + "<!--#endregion-->";
            }
            m.appendReplacement(out, Matcher.quoteReplacement(replacement));
        }
        m.appendTail(out);
        return out.toString();
    }

    /**
     * Giá trị vùng có làm hỏng marker không (chứa cú pháp region lồng nhau). Dùng để chặn từ phía
     * service trước khi ghép, tránh admin vô tình phá cấu trúc.
     */
    public static boolean containsMarkerSyntax(String value) {
        return value != null && (value.contains("<!--#region") || value.contains("<!--#endregion-->"));
    }

    private static Map<String, String> parseAttributes(String attrText) {
        Map<String, String> attrs = new LinkedHashMap<>();
        Matcher a = ATTR.matcher(attrText);
        while (a.find()) {
            attrs.put(a.group(1), a.group(2));
        }
        return attrs;
    }

    private static String normalizeType(String type) {
        return "text".equalsIgnoreCase(type) ? "text" : "html";
    }

    private static String escape(String s) {
        return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");
    }

    private static String unescape(String s) {
        return s.replace("&lt;", "<").replace("&gt;", ">").replace("&amp;", "&");
    }
}
