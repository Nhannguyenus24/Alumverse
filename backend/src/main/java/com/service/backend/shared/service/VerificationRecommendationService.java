package com.service.backend.shared.service;

import java.text.Normalizer;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.Arrays;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;

import com.service.backend.admin.dto.VerificationRecommendationContext;
import com.service.backend.shared.dto.VerificationRecommendationResponse;
import com.service.backend.shared.utils.JsonUtils;

import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;
import java.time.Duration;

/** Runs the AI assessor and applies a conservative deterministic fallback. */
@Service
public class VerificationRecommendationService {
    private static final Logger log = LoggerFactory.getLogger(VerificationRecommendationService.class);
    private static final Set<String> VERDICTS = Set.of("APPROVE", "REVIEW", "REJECT", "PENDING");
    private static final String DISCLAIMER =
            "Khuyến nghị AI chỉ để tham khảo; quản trị viên phải kiểm tra giấy tờ và quyết định cuối cùng.";
    private static final int MAX_OCR_CHARS = 6_000;

    private final VerificationRecommendationAiService aiService;
    private final Cache<String, VerificationRecommendationResponse> recommendationCache = Caffeine.newBuilder()
            .maximumSize(2_000)
            .expireAfterWrite(Duration.ofHours(6))
            .build();

    public VerificationRecommendationService(VerificationRecommendationAiService aiService) {
        this.aiService = aiService;
    }

    public Mono<VerificationRecommendationResponse> recommend(VerificationRecommendationContext context) {
        if (!isReadable(context.getOcrText())) {
            return Mono.just(pendingResponse());
        }

        VerificationRecommendationContext safeContext = copyWithBoundedOcr(context);
        String cacheKey = cacheKey(safeContext);
        VerificationRecommendationResponse cached = recommendationCache.getIfPresent(cacheKey);
        if (cached != null) {
            return Mono.just(cached);
        }
        return Mono.fromCallable(() -> normalize(aiService.recommend(JsonUtils.toJson(safeContext))))
                .subscribeOn(Schedulers.boundedElastic())
                .doOnNext(result -> recommendationCache.put(cacheKey, result))
                .onErrorResume(error -> {
                    log.warn("Verification recommendation AI unavailable for request {}: {}",
                            context.getRequestId(), error.getMessage());
                    return Mono.just(fallback(context));
                });
    }

    private VerificationRecommendationResponse normalize(VerificationRecommendationResponse result) {
        if (result == null || !StringUtils.hasText(result.getVerdict())) {
            throw new IllegalStateException("AI returned an empty recommendation");
        }
        String verdict = result.getVerdict().trim().toUpperCase(Locale.ROOT);
        if (!VERDICTS.contains(verdict)) {
            throw new IllegalStateException("AI returned an unsupported verdict: " + verdict);
        }
        return VerificationRecommendationResponse.builder()
                .verdict(verdict)
                .summary(defaultText(result.getSummary(), "AI đã hoàn tất đối chiếu hồ sơ."))
                .reasons(safeList(result.getReasons()))
                .mismatches(safeList(result.getMismatches()))
                .generatedByAi(true)
                .disclaimer(DISCLAIMER)
                .build();
    }

    private VerificationRecommendationResponse fallback(VerificationRecommendationContext context) {
        List<String> reasons = new ArrayList<>();
        List<String> mismatches = new ArrayList<>();
        String normalizedOcr = normalizeText(context.getOcrText());

        compareStudentId(context.getStudentId(), normalizedOcr, reasons, mismatches);
        compareName(context.getFullName(), normalizedOcr, reasons, mismatches);

        boolean conflict = !mismatches.isEmpty();
        if (!conflict) {
            reasons.add("MSSV và họ tên tự khai không có mâu thuẫn rõ ràng với phần OCR.");
        }
        return VerificationRecommendationResponse.builder()
                .verdict("REVIEW")
                .summary(conflict
                        ? "AI tạm thời không khả dụng; kiểm tra cục bộ phát hiện dữ liệu cần đối chiếu thủ công."
                        : "AI tạm thời không khả dụng; kiểm tra cục bộ chưa phát hiện mâu thuẫn rõ ràng.")
                .reasons(reasons)
                .mismatches(mismatches)
                .generatedByAi(false)
                .disclaimer(DISCLAIMER)
                .build();
    }

    private void compareStudentId(String declared, String normalizedOcr,
                                  List<String> reasons, List<String> mismatches) {
        if (!StringUtils.hasText(declared)) {
            reasons.add("MSSV chưa được khai báo đầy đủ.");
            return;
        }
        if (normalizedOcr.contains(normalizeText(declared))) {
            reasons.add("MSSV tự khai xuất hiện trong phần OCR.");
        } else {
            mismatches.add("Không tìm thấy MSSV tự khai trong phần OCR.");
        }
    }

    private void compareName(String declared, String normalizedOcr,
                             List<String> reasons, List<String> mismatches) {
        if (!StringUtils.hasText(declared)) {
            reasons.add("Họ tên chưa được khai báo đầy đủ.");
            return;
        }
        if (nameTokensMatch(declared, normalizedOcr)) {
            reasons.add("Các thành phần họ tên tự khai xuất hiện trong OCR, không phụ thuộc thứ tự và dấu.");
        } else {
            mismatches.add("Họ tên tự khai chưa khớp đủ với phần OCR; cần đối chiếu thủ công.");
        }
    }

    private VerificationRecommendationResponse pendingResponse() {
        return VerificationRecommendationResponse.builder()
                .verdict("PENDING")
                .summary("Chưa có nội dung OCR đủ đọc để AI đối chiếu.")
                .reasons(List.of("Vui lòng chờ trích xuất hoàn tất hoặc kiểm tra giấy tờ thủ công."))
                .mismatches(List.of())
                .generatedByAi(false)
                .disclaimer(DISCLAIMER)
                .build();
    }

    private boolean isReadable(String value) {
        if (!StringUtils.hasText(value)) return false;
        String trimmed = value.trim();
        return trimmed.length() >= 25 && !"UNREADABLE".equalsIgnoreCase(trimmed);
    }

    private VerificationRecommendationContext copyWithBoundedOcr(VerificationRecommendationContext source) {
        String ocr = source.getOcrText();
        if (ocr != null && ocr.length() > MAX_OCR_CHARS) {
            ocr = ocr.substring(0, MAX_OCR_CHARS);
        }
        return VerificationRecommendationContext.builder()
                .requestId(source.getRequestId())
                .memberId(source.getMemberId())
                .organizationId(source.getOrganizationId())
                .fullName(source.getFullName())
                .studentId(source.getStudentId())
                .declaredFaculty(source.getDeclaredFaculty())
                .declaredProgram(source.getDeclaredProgram())
                .declaredMajor(source.getDeclaredMajor())
                .declaredStartedYear(source.getDeclaredStartedYear())
                .declaredGraduatedYear(source.getDeclaredGraduatedYear())
                .declaredGraduationStatus(source.getDeclaredGraduationStatus())
                .documentType(source.getDocumentType())
                .ocrText(ocr)
                .normalizedNameMatch(nameTokensMatch(source.getFullName(), normalizeText(ocr)))
                .studentIdMatch(StringUtils.hasText(source.getStudentId())
                        && normalizeText(ocr).contains(normalizeText(source.getStudentId())))
                .build();
    }

    static boolean nameTokensMatch(String declaredName, String normalizedOcr) {
        if (!StringUtils.hasText(declaredName) || !StringUtils.hasText(normalizedOcr)) return false;
        Set<String> ocrTokens = Set.copyOf(Arrays.asList(normalizeTextStatic(normalizedOcr).split("\\s+")));
        List<String> nameTokens = Arrays.stream(normalizeTextStatic(declaredName).split("\\s+"))
                .filter(token -> token.length() > 1)
                .distinct()
                .toList();
        if (nameTokens.isEmpty()) return false;
        long matched = nameTokens.stream()
                .filter(nameToken -> ocrTokens.stream().anyMatch(ocrToken -> tokensEqualOrOneEdit(nameToken, ocrToken)))
                .count();
        return matched == nameTokens.size() || (nameTokens.size() >= 4 && matched >= nameTokens.size() - 1);
    }

    private static boolean tokensEqualOrOneEdit(String left, String right) {
        if (left.equals(right)) return true;
        if (left.length() < 4 || right.length() < 4 || Math.abs(left.length() - right.length()) > 1) return false;
        int i = 0;
        int j = 0;
        int edits = 0;
        while (i < left.length() && j < right.length()) {
            if (left.charAt(i) == right.charAt(j)) {
                i++;
                j++;
                continue;
            }
            if (++edits > 1) return false;
            if (left.length() > right.length()) i++;
            else if (right.length() > left.length()) j++;
            else {
                i++;
                j++;
            }
        }
        if (i < left.length() || j < right.length()) edits++;
        return edits <= 1;
    }

    private String cacheKey(VerificationRecommendationContext context) {
        return context.getRequestId() + ":" + Integer.toHexString(JsonUtils.toJson(context).hashCode());
    }

    private String normalizeText(String value) {
        return normalizeTextStatic(value);
    }

    private static String normalizeTextStatic(String value) {
        String decomposed = Normalizer.normalize(value == null ? "" : value, Normalizer.Form.NFD);
        return decomposed.replaceAll("\\p{M}+", "")
                .replace('đ', 'd').replace('Đ', 'D')
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", " ")
                .trim();
    }

    private List<String> safeList(List<String> values) {
        if (values == null) return List.of();
        return values.stream().filter(StringUtils::hasText).map(String::trim).limit(10).toList();
    }

    private String defaultText(String value, String fallback) {
        return StringUtils.hasText(value) ? value.trim() : fallback;
    }
}
