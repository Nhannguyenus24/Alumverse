package com.service.backend.survey.controller;

import com.service.backend.shared.dto.ApiResponse;
import com.service.backend.survey.dto.SubmitSurveyRequest;
import com.service.backend.survey.dto.SurveyResponse;
import com.service.backend.survey.dto.SurveySubmissionResponse;
import com.service.backend.survey.service.SurveyService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.util.List;

@Tag(name = "Surveys", description = "Khảo sát dành cho người dùng")
@RestController
@RequestMapping("/api/surveys")
@Validated
public class SurveyController {

    private final SurveyService surveyService;

    public SurveyController(SurveyService surveyService) {
        this.surveyService = surveyService;
    }

    @Operation(summary = "Các khảo sát đang mở trong tổ chức của người dùng (kèm trạng thái đã làm hay chưa)")
    @GetMapping("/active")
    public Mono<ResponseEntity<ApiResponse<List<SurveyResponse>>>> active() {
        return surveyService.getActiveSurveys()
                .map(list -> ResponseEntity.ok(new ApiResponse<>("Retrieved active surveys", list)));
    }

    @Operation(summary = "Lấy chi tiết một khảo sát để điền (kèm trạng thái đã làm)")
    @GetMapping("/{id}")
    public Mono<ResponseEntity<ApiResponse<SurveyResponse>>> getById(
            @PathVariable @Min(1) Long id) {
        return surveyService.getSurveyForUser(id)
                .map(s -> ResponseEntity.ok(new ApiResponse<>("Retrieved survey", s)));
    }

    @Operation(summary = "Nộp câu trả lời khảo sát")
    @PostMapping("/{id}/submit")
    public Mono<ResponseEntity<ApiResponse<SurveySubmissionResponse>>> submit(
            @PathVariable @Min(1) Long id,
            @Valid @RequestBody SubmitSurveyRequest request) {
        return surveyService.submitSurvey(id, request)
                .map(s -> ResponseEntity.status(HttpStatus.CREATED)
                        .body(new ApiResponse<>("Survey submitted successfully", s)));
    }

    @Operation(summary = "Xem lại bài khảo sát đã nộp của chính mình")
    @GetMapping("/{id}/my-submission")
    public Mono<ResponseEntity<ApiResponse<SurveySubmissionResponse>>> mySubmission(
            @PathVariable @Min(1) Long id) {
        return surveyService.getMySubmission(id)
                .map(s -> ResponseEntity.ok(new ApiResponse<>("Retrieved my submission", s)));
    }
}
