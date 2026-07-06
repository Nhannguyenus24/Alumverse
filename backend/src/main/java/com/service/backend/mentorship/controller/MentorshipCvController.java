package com.service.backend.mentorship.controller;

import com.service.backend.mentorship.dto.ExtractCvRequest;
import com.service.backend.shared.dto.ApiResponse;
import com.service.backend.shared.dto.CvExtractionResponse;
import com.service.backend.shared.enums.ErrorCode;
import com.service.backend.shared.exception.ApplicationException;
import com.service.backend.shared.service.CvExtractionService;
import com.service.backend.shared.service.FileUploadService;
import com.service.backend.shared.service.OCRService;
import com.service.backend.shared.service.SkillExtractionFallback;
import com.service.backend.shared.service.SkillExtractionService;

import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

@Slf4j
@Tag(name = "Mentorship > CV", description = "AI-assisted CV upload and profile auto-fill")
@RestController
@RequestMapping("/api/mentorship/cv")
@RequiredArgsConstructor
@Validated
public class MentorshipCvController {

    private final FileUploadService fileUploadService;
    private final OCRService ocrService;
    private final CvExtractionService cvExtractionService;
    private final SkillExtractionService skillExtractionService;

    @PostMapping("/extract")
    public Mono<ResponseEntity<ApiResponse<CvExtractionResponse>>> extractCv(
            @Valid @RequestBody ExtractCvRequest request) {
        if (!request.getOriginalFileName().toLowerCase().endsWith(".pdf")) {
            return Mono.error(new ApplicationException(ErrorCode.BAD_REQUEST, "Only PDF files are supported for CV upload"));
        }
        return fileUploadService.uploadBase64File(request.getBase64File(), request.getOriginalFileName())
                .flatMap(fileUrl -> {
                    String localPath = fileUploadService.getLocalPath(fileUrl);
                    return ocrService.extractTextFromFile(localPath)
                            .flatMap(text -> Mono.zip(
                                            Mono.fromCallable(() -> cvExtractionService.extractProfile(text))
                                                    .subscribeOn(Schedulers.boundedElastic()),
                                            extractTags(text))
                                    .map(tuple -> {
                                        CvExtractionResponse profile = tuple.getT1();
                                        profile.setExpertiseTags(tuple.getT2());
                                        return ResponseEntity.ok(
                                                new ApiResponse<>("CV parsed successfully", profile));
                                    }));
                })
                .doOnError(e -> log.error("CV extraction failed: {}", e.getMessage()));
    }

    private Mono<java.util.List<String>> extractTags(String text) {
        return Mono.fromCallable(() -> skillExtractionService.extractTags(text))
                .subscribeOn(Schedulers.boundedElastic())
                .map(result -> result != null && result.getTags() != null && !result.getTags().isEmpty()
                        ? result.getTags()
                        : SkillExtractionFallback.extract(text).getTags())
                .onErrorResume(e -> Mono.just(SkillExtractionFallback.extract(text).getTags()));
    }
}
