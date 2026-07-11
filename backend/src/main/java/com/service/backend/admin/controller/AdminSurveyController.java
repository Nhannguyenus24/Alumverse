package com.service.backend.admin.controller;

import com.service.backend.shared.dto.ApiResponse;
import com.service.backend.shared.dto.PaginatedResponse;
import com.service.backend.shared.utils.SecurityUtils;
import com.service.backend.survey.dto.CreateSurveyRequest;
import com.service.backend.survey.dto.SurveyInsightResponse;
import com.service.backend.survey.dto.SurveyResponse;
import com.service.backend.survey.dto.SurveySubmissionResponse;
import com.service.backend.survey.dto.SurveySummaryResponse;
import com.service.backend.survey.dto.UpdateSurveyRequest;
import com.service.backend.survey.service.SurveyService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

@Tag(name = "Admin > Surveys", description = "Quản lý form khảo sát cho ADMIN/STAFF")
@RestController
@RequestMapping("/api/admin/surveys")
@Validated
@PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
public class AdminSurveyController {

    private final SurveyService surveyService;

    public AdminSurveyController(SurveyService surveyService) {
        this.surveyService = surveyService;
    }

    @Operation(summary = "Liệt kê form khảo sát (phân trang, lọc theo org/status, tìm kiếm)")
    @GetMapping
    public Mono<ResponseEntity<ApiResponse<PaginatedResponse<SurveyResponse>>>> list(
            @RequestParam(required = false) Long organizationId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String keyword,
            @Parameter(example = "0") @RequestParam(defaultValue = "0") @Min(0) int page,
            @Parameter(example = "10") @RequestParam(defaultValue = "10") @Min(1) int size) {
        Integer orgIdInt = organizationId != null ? organizationId.intValue() : null;
        return SecurityUtils.resolveOrganizationId(orgIdInt)
                .flatMap(resolved -> surveyService.listSurveys(resolved.longValue(), status, keyword, page, size))
                .switchIfEmpty(surveyService.listSurveys(null, status, keyword, page, size))
                .map(paginated -> ResponseEntity.ok(new ApiResponse<>("Retrieved surveys", paginated)));
    }

    @Operation(summary = "Xem chi tiết một form khảo sát")
    @GetMapping("/{id}")
    public Mono<ResponseEntity<ApiResponse<SurveyResponse>>> getById(
            @PathVariable @Min(1) Long id) {
        return surveyService.getSurveyById(id)
                .map(s -> ResponseEntity.ok(new ApiResponse<>("Retrieved survey", s)));
    }

    @Operation(summary = "Tạo form khảo sát (mặc định trạng thái DRAFT)")
    @PostMapping
    public Mono<ResponseEntity<ApiResponse<SurveyResponse>>> create(
            @Valid @RequestBody CreateSurveyRequest request) {
        return surveyService.createSurvey(request)
                .map(s -> ResponseEntity.status(HttpStatus.CREATED)
                        .body(new ApiResponse<>("Survey created successfully", s)));
    }

    @Operation(summary = "Cập nhật form khảo sát (chỉ khi đang DRAFT)")
    @PutMapping("/{id}")
    public Mono<ResponseEntity<ApiResponse<SurveyResponse>>> update(
            @PathVariable @Min(1) Long id,
            @Valid @RequestBody UpdateSurveyRequest request) {
        return surveyService.updateSurvey(id, request)
                .map(s -> ResponseEntity.ok(new ApiResponse<>("Survey updated successfully", s)));
    }

    @Operation(summary = "Mở / mở lại khảo sát (bắt đầu cửa sổ hoạt động ngay bây giờ)")
    @PostMapping("/{id}/open")
    public Mono<ResponseEntity<ApiResponse<SurveyResponse>>> open(
            @PathVariable @Min(1) Long id) {
        return surveyService.openSurvey(id)
                .map(s -> ResponseEntity.ok(new ApiResponse<>("Survey opened successfully", s)));
    }

    @Operation(summary = "Đóng / vô hiệu hóa khảo sát")
    @PostMapping("/{id}/close")
    public Mono<ResponseEntity<ApiResponse<SurveyResponse>>> close(
            @PathVariable @Min(1) Long id) {
        return surveyService.closeSurvey(id)
                .map(s -> ResponseEntity.ok(new ApiResponse<>("Survey closed successfully", s)));
    }

    @Operation(summary = "Xóa form khảo sát")
    @DeleteMapping("/{id}")
    public Mono<ResponseEntity<ApiResponse<Void>>> delete(
            @PathVariable @Min(1) Long id) {
        return surveyService.deleteSurvey(id)
                .thenReturn(ResponseEntity.ok(new ApiResponse<Void>("Survey deleted successfully", null)));
    }

    @Operation(summary = "Danh sách người trả lời của một khảo sát (phân trang)")
    @GetMapping("/{id}/submissions")
    public Mono<ResponseEntity<ApiResponse<PaginatedResponse<SurveySubmissionResponse>>>> submissions(
            @PathVariable @Min(1) Long id,
            @Parameter(example = "0") @RequestParam(defaultValue = "0") @Min(0) int page,
            @Parameter(example = "20") @RequestParam(defaultValue = "20") @Min(1) int size) {
        return surveyService.getSubmissions(id, page, size)
                .map(paginated -> ResponseEntity.ok(new ApiResponse<>("Retrieved submissions", paginated)));
    }

    @Operation(summary = "Tổng hợp kết quả khảo sát theo từng câu hỏi")
    @GetMapping("/{id}/summary")
    public Mono<ResponseEntity<ApiResponse<SurveySummaryResponse>>> summary(
            @PathVariable @Min(1) Long id) {
        return surveyService.getSummary(id)
                .map(s -> ResponseEntity.ok(new ApiResponse<>("Retrieved survey summary", s)));
    }

    @Operation(summary = "Phân tích AI (Gemini) từ kết quả tổng hợp khảo sát")
    @GetMapping("/{id}/insight")
    public Mono<ResponseEntity<ApiResponse<SurveyInsightResponse>>> insight(
            @PathVariable @Min(1) Long id) {
        return surveyService.getInsight(id)
                .map(s -> ResponseEntity.ok(new ApiResponse<>("Generated survey insight", s)));
    }
}
