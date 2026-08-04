package com.service.backend.shared.service;

import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;

import org.junit.jupiter.api.Test;

import com.service.backend.admin.dto.VerificationRecommendationContext;
import com.service.backend.shared.dto.VerificationRecommendationResponse;

import reactor.test.StepVerifier;

class VerificationRecommendationServiceTest {

    @Test
    void returnsSanitizedAiRecommendation() {
        VerificationRecommendationAiService aiService = ignored -> VerificationRecommendationResponse.builder()
                .verdict("approve")
                .summary("  Dữ liệu phù hợp. ")
                .reasons(List.of(" MSSV trùng khớp "))
                .mismatches(null)
                .build();

        VerificationRecommendationService service = new VerificationRecommendationService(aiService);

        StepVerifier.create(service.recommend(readableContext()))
                .assertNext(result -> {
                    org.junit.jupiter.api.Assertions.assertEquals("APPROVE", result.getVerdict());
                    org.junit.jupiter.api.Assertions.assertEquals(List.of("MSSV trùng khớp"), result.getReasons());
                    org.junit.jupiter.api.Assertions.assertTrue(result.getMismatches().isEmpty());
                    org.junit.jupiter.api.Assertions.assertTrue(result.getGeneratedByAi());
                })
                .verifyComplete();
    }

    @Test
    void usesConservativeFallbackWhenAiFails() {
        VerificationRecommendationAiService aiService = ignored -> {
            throw new IllegalStateException("model unavailable");
        };
        VerificationRecommendationService service = new VerificationRecommendationService(aiService);
        VerificationRecommendationContext context = readableContext();
        context.setOcrText("Họ tên: Người Khác\nMSSV: 99123456\nKhoa: Công nghệ thông tin");

        StepVerifier.create(service.recommend(context))
                .assertNext(result -> {
                    org.junit.jupiter.api.Assertions.assertEquals("REVIEW", result.getVerdict());
                    org.junit.jupiter.api.Assertions.assertFalse(result.getGeneratedByAi());
                    org.junit.jupiter.api.Assertions.assertFalse(result.getMismatches().isEmpty());
                })
                .verifyComplete();
    }

    @Test
    void doesNotCallAiBeforeOcrIsReadable() {
        AtomicInteger calls = new AtomicInteger();
        VerificationRecommendationAiService aiService = ignored -> {
            calls.incrementAndGet();
            return VerificationRecommendationResponse.builder().verdict("APPROVE").build();
        };
        VerificationRecommendationService service = new VerificationRecommendationService(aiService);
        VerificationRecommendationContext context = readableContext();
        context.setOcrText("UNREADABLE");

        StepVerifier.create(service.recommend(context))
                .assertNext(result -> {
                    org.junit.jupiter.api.Assertions.assertEquals("PENDING", result.getVerdict());
                    org.junit.jupiter.api.Assertions.assertFalse(result.getGeneratedByAi());
                })
                .verifyComplete();

        org.junit.jupiter.api.Assertions.assertEquals(0, calls.get());
    }

    @Test
    void matchesVietnameseNameIgnoringOrderAndAccents() {
        org.junit.jupiter.api.Assertions.assertTrue(VerificationRecommendationService.nameTokensMatch(
                "Nguyễn Thị Minh Anh",
                "ho ten anh minh thi nguyen mssv 22123456"));
    }

    @Test
    void toleratesOneMissingTokenForLongName() {
        org.junit.jupiter.api.Assertions.assertTrue(VerificationRecommendationService.nameTokensMatch(
                "Nguyễn Trần Hoàng Minh Anh",
                "ho ten nguyen tran minh anh mssv 22123456"));
    }

    @Test
    void doesNotMatchDifferentName() {
        org.junit.jupiter.api.Assertions.assertFalse(VerificationRecommendationService.nameTokensMatch(
                "Nguyễn Văn An",
                "ho ten tran thi binh mssv 22123456"));
    }

    @Test
    void toleratesOneCharacterOcrErrorInNameToken() {
        org.junit.jupiter.api.Assertions.assertTrue(VerificationRecommendationService.nameTokensMatch(
                "Nguyễn Thị Minh Anh",
                "ho ten anh minh thj nguyen mssv 22123456"));
    }

    @Test
    void sendsDerivedMatchSignalsAndCachesAiResult() {
        AtomicInteger calls = new AtomicInteger();
        AtomicReference<String> payload = new AtomicReference<>();
        VerificationRecommendationAiService aiService = contextJson -> {
            calls.incrementAndGet();
            payload.set(contextJson);
            return VerificationRecommendationResponse.builder()
                    .verdict("APPROVE")
                    .summary("Tên và MSSV phù hợp.")
                    .reasons(List.of("Tên khớp không phụ thuộc thứ tự."))
                    .mismatches(List.of())
                    .build();
        };
        VerificationRecommendationService service = new VerificationRecommendationService(aiService);
        VerificationRecommendationContext context = readableContext();
        context.setFullName("Nguyễn Thị Minh Anh");
        context.setOcrText("Họ tên: Anh Minh Thị Nguyễn\nMSSV: 22123456\nLoại giấy tờ: Thẻ sinh viên");

        StepVerifier.create(service.recommend(context)).expectNextCount(1).verifyComplete();
        StepVerifier.create(service.recommend(context)).expectNextCount(1).verifyComplete();

        org.junit.jupiter.api.Assertions.assertEquals(1, calls.get());
        org.junit.jupiter.api.Assertions.assertTrue(payload.get().contains("\"normalizedNameMatch\":true"));
        org.junit.jupiter.api.Assertions.assertTrue(payload.get().contains("\"studentIdMatch\":true"));
    }

    private VerificationRecommendationContext readableContext() {
        return VerificationRecommendationContext.builder()
                .requestId(10)
                .memberId(20)
                .organizationId(1)
                .fullName("Nguyễn Văn An")
                .studentId("22123456")
                .declaredFaculty("[\"Công nghệ thông tin\"]")
                .declaredStartedYear("[2022]")
                .documentType("STUDENT_CARD")
                .ocrText("Loại giấy tờ: Thẻ sinh viên\nHọ tên: Nguyễn Văn An\nMSSV: 22123456")
                .build();
    }
}
