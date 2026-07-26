package com.service.backend.shared.service;

import java.io.File;
import java.nio.file.Files;
import java.util.Base64;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicReference;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;

import com.service.backend.config.ai.AiModelFactory;
import com.service.backend.shared.dao.AiProviderR2dbcRepository;
import com.service.backend.shared.utils.AiSecretCipher;

import dev.langchain4j.data.message.AiMessage;
import dev.langchain4j.data.message.ImageContent;
import dev.langchain4j.data.message.TextContent;
import dev.langchain4j.data.message.UserMessage;
import dev.langchain4j.model.chat.ChatLanguageModel;
import dev.langchain4j.model.output.Response;
import reactor.core.publisher.Mono;

/**
 * Đọc chữ trên ảnh giấy tờ bằng model AI nhìn được ảnh (vision).
 *
 * <p>Dùng lại provider admin đã cấu hình trong {@code ai_providers} (lấy key + base URL), nhưng
 * ép sang model vision cấu hình ở {@code ocr.vision.model} — vì model mặc định của chain có thể
 * chỉ xử lý text (vd. gpt-oss), đưa ảnh vào sẽ hỏng.
 *
 * <p>Không đi qua {@code DynamicChatModel} vì lý do trên. Mọi lỗi đều trả {@link Optional#empty()}
 * và {@link OCRService} sẽ báo lỗi OCR.
 */
@Service
public class VisionOcrService {

    private static final Logger log = LoggerFactory.getLogger(VisionOcrService.class);

    /** Model trả về đúng chuỗi này khi ảnh không đọc nổi. */
    static final String UNREADABLE_MARKER = "UNREADABLE";

    // Chỉ trích thông tin dùng để đối chiếu danh tính. Đổ nguyên văn giấy tờ dài (bảng điểm,
    // bằng tốt nghiệp) thì admin phải tự lọc, mà địa chỉ / khẩu hiệu / website đều vô dụng ở đây.
    private static final String PROMPT = """
            Đây là ảnh chụp giấy tờ của sinh viên (thẻ sinh viên, bằng tốt nghiệp, giấy xác nhận...).
            Chỉ trích những thông tin dùng để đối chiếu danh tính, mỗi dòng một mục dạng "Nhãn: giá trị",
            theo đúng thứ tự sau nếu có trên giấy tờ:
            Loại giấy tờ, Họ tên, MSSV, Ngày sinh, Khoa, Ngành, Bậc/Hệ đào tạo, Khoá/Năm học, Nơi cấp.
            Luôn giữ Họ tên và MSSV nếu chúng xuất hiện, kể cả khi không có nhãn đi kèm.
            Giữ nguyên dấu tiếng Việt. Bỏ qua địa chỉ, website, khẩu hiệu và mọi chữ không liên quan.
            Mục nào không có thì bỏ hẳn dòng đó, không ghi "không có".
            Không thêm giải thích, không markdown.
            Nếu ảnh quá mờ, bị che hoặc không đọc được chữ nào, chỉ trả về đúng một từ: %s
            """.formatted(UNREADABLE_MARKER);

    private final AiProviderR2dbcRepository providerRepo;
    private final AiSecretCipher cipher;
    private final AiModelFactory modelFactory;
    private final boolean enabled;
    private final String visionModelName;

    private final AtomicReference<ChatLanguageModel> model = new AtomicReference<>();

    public VisionOcrService(AiProviderR2dbcRepository providerRepo,
                            AiSecretCipher cipher,
                            AiModelFactory modelFactory,
                            @Value("${ocr.vision.enabled:true}") boolean enabled,
                            @Value("${ocr.vision.model:}") String visionModelName) {
        this.providerRepo = providerRepo;
        this.cipher = cipher;
        this.modelFactory = modelFactory;
        this.enabled = enabled;
        this.visionModelName = visionModelName;
    }

    /** Dựng model sau khi DB sẵn sàng; hỏng thì chỉ log, chức năng OCR có thể không hoạt động. */
    @EventListener(ApplicationReadyEvent.class)
    public void onStartup() {
        reload().subscribe(
                ok -> { },
                e -> log.warn("Vision OCR: không nạp được provider, chức năng OCR có thể lỗi. {}", e.getMessage()));
    }

    /** Nạp lại model vision từ provider đang bật. Gọi lại sau khi admin đổi cấu hình AI. */
    public Mono<Boolean> reload() {
        if (!enabled) {
            log.info("Vision OCR tắt (ocr.vision.enabled=false).");
            return Mono.just(false);
        }
        if (visionModelName == null || visionModelName.isBlank()) {
            log.info("Vision OCR chưa cấu hình ocr.vision.model.");
            return Mono.just(false);
        }
        return providerRepo.findByEnabledTrueOrderByPriorityAscIdAsc()
                .next()
                .map(provider -> {
                    try {
                        String apiKey = cipher.decrypt(provider.getApiKeyEnc());
                        model.set(modelFactory.buildModel(
                                provider.getProviderType(), provider.getBaseUrl(), apiKey, visionModelName, 0.0));
                        log.info("Vision OCR bật: provider '{}' model '{}'.", provider.getName(), visionModelName);
                        return true;
                    } catch (RuntimeException e) {
                        log.warn("Vision OCR: không dựng được model từ provider '{}' — {}",
                                provider.getName(), e.getMessage());
                        return false;
                    }
                })
                .defaultIfEmpty(false)
                .doOnNext(ok -> {
                    if (!ok) {
                        model.set(null);
                    }
                });
    }

    public boolean isEnabled() {
        return model.get() != null;
    }

    /**
     * @return chữ đọc được, hoặc rỗng khi chưa bật / gọi lỗi / ảnh không đọc nổi.
     */
    public Optional<String> extractText(File imageFile, String mimeType) {
        ChatLanguageModel current = model.get();
        if (current == null) {
            return Optional.empty();
        }
        try {
            String base64 = Base64.getEncoder().encodeToString(Files.readAllBytes(imageFile.toPath()));
            UserMessage message = UserMessage.from(List.of(
                    ImageContent.from(base64, mimeType),
                    TextContent.from(PROMPT)));

            Response<AiMessage> response = current.generate(List.of(message));
            String text = response == null || response.content() == null ? null : response.content().text();

            if (text == null || text.isBlank() || UNREADABLE_MARKER.equalsIgnoreCase(text.trim())) {
                log.info("Vision OCR không đọc được chữ nào từ '{}'.", imageFile.getName());
                return Optional.empty();
            }
            return Optional.of(text.trim());
        } catch (Exception e) {
            log.warn("Vision OCR lỗi với '{}': {}", imageFile.getName(), e.getMessage());
            return Optional.empty();
        }
    }
}
