package com.service.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.spring6.SpringTemplateEngine;
import org.thymeleaf.templatemode.TemplateMode;
import org.thymeleaf.templateresolver.ClassLoaderTemplateResolver;
import org.thymeleaf.templateresolver.StringTemplateResolver;

@Configuration
public class EmailConfig {

    @Primary
    @Bean(name = "templateEngine")
    public SpringTemplateEngine emailTemplateEngine() {
        SpringTemplateEngine engine = new SpringTemplateEngine();
        // Thứ tự resolver quan trọng:
        // 1) ClassLoaderTemplateResolver: khi truyền vào tên template (vd "otpVerification"),
        //    resolver này tìm file templates/otpVerification.html. Bật checkExistence để nếu KHÔNG
        //    tìm thấy file (trường hợp truyền vào chuỗi HTML từ DB) thì Thymeleaf chuyển sang resolver kế tiếp.
        // 2) StringTemplateResolver: coi chính chuỗi truyền vào là nội dung template (HTML từ DB).
        engine.addTemplateResolver(fileTemplateResolver());
        engine.addTemplateResolver(stringTemplateResolver());
        return engine;
    }

    /** Resolver cho template file .html trên classpath (giữ nguyên hành vi cũ + làm fallback). */
    private ClassLoaderTemplateResolver fileTemplateResolver() {
        ClassLoaderTemplateResolver resolver = new ClassLoaderTemplateResolver();
        resolver.setOrder(1);
        resolver.setPrefix("templates/");
        resolver.setSuffix(".html");
        resolver.setTemplateMode(TemplateMode.HTML);
        resolver.setCharacterEncoding("UTF-8");
        resolver.setCacheable(true);
        // Nếu không tồn tại file tương ứng -> nhường cho resolver kế tiếp thay vì báo lỗi.
        resolver.setCheckExistence(true);
        return resolver;
    }

    /**
     * Resolver xử lý trực tiếp chuỗi HTML (nội dung template lưu trong DB do admin chỉnh sửa).
     * Tắt cache để admin sửa xong là email dùng ngay nội dung mới (tránh giữ bản cũ theo key = chuỗi HTML).
     */
    private StringTemplateResolver stringTemplateResolver() {
        StringTemplateResolver resolver = new StringTemplateResolver();
        resolver.setOrder(2);
        resolver.setTemplateMode(TemplateMode.HTML);
        resolver.setCacheable(false);
        return resolver;
    }
}
