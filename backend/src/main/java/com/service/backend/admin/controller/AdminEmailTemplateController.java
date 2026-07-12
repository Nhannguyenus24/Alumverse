package com.service.backend.admin.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.service.backend.admin.dto.EmailTemplatePreviewRequest;
import com.service.backend.admin.dto.EmailTemplatePreviewResponse;
import com.service.backend.admin.dto.EmailTemplateResponse;
import com.service.backend.admin.dto.PreviewEmailTemplateRegionsRequest;
import com.service.backend.admin.dto.UpdateEmailTemplateRegionsRequest;
import com.service.backend.admin.dto.UpdateEmailTemplateRequest;
import com.service.backend.admin.service.AdminEmailTemplateService;
import com.service.backend.shared.dto.ApiResponse;
import com.service.backend.shared.utils.SecurityUtils;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import reactor.core.publisher.Mono;

@Tag(name = "Admin > Email Templates", description = "Quản lý nội dung email template (chỉ ADMIN)")
@RestController
@RequestMapping("/api/admin/email-templates")
@Validated
@PreAuthorize("hasRole('ADMIN')")
public class AdminEmailTemplateController {

    private final AdminEmailTemplateService service;

    public AdminEmailTemplateController(AdminEmailTemplateService service) {
        this.service = service;
    }

    @Operation(summary = "Danh sách email template")
    @GetMapping
    public Mono<ResponseEntity<ApiResponse<List<EmailTemplateResponse>>>> getAll() {
        return service.getAll()
                .map(list -> ResponseEntity.ok(new ApiResponse<>("Email templates retrieved successfully", list)));
    }

    @Operation(summary = "Chi tiết một email template")
    @GetMapping("/{id}")
    public Mono<ResponseEntity<ApiResponse<EmailTemplateResponse>>> getById(@PathVariable @Min(1) Long id) {
        return service.getById(id)
                .map(tpl -> ResponseEntity.ok(new ApiResponse<>("Email template retrieved successfully", tpl)));
    }

    @Operation(summary = "Cập nhật subject + nội dung email template")
    @PutMapping("/{id}")
    public Mono<ResponseEntity<ApiResponse<EmailTemplateResponse>>> update(
            @PathVariable @Min(1) Long id,
            @Valid @RequestBody UpdateEmailTemplateRequest request) {
        return SecurityUtils.getCurrentUserId()
                .flatMap(userId -> service.update(id, request, userId))
                .map(tpl -> ResponseEntity.ok(new ApiResponse<>("Email template updated successfully", tpl)));
    }

    @Operation(summary = "Cập nhật template theo vùng sửa được (chế độ thân thiện, không đụng HTML kỹ thuật)")
    @PutMapping("/{id}/regions")
    public Mono<ResponseEntity<ApiResponse<EmailTemplateResponse>>> updateRegions(
            @PathVariable @Min(1) Long id,
            @Valid @RequestBody UpdateEmailTemplateRegionsRequest request) {
        return SecurityUtils.getCurrentUserId()
                .flatMap(userId -> service.updateRegions(id, request, userId))
                .map(tpl -> ResponseEntity.ok(new ApiResponse<>("Email template updated successfully", tpl)));
    }

    @Operation(summary = "Khôi phục nội dung template về mẫu gốc (bật lại vùng sửa được)")
    @PostMapping("/{id}/reset")
    public Mono<ResponseEntity<ApiResponse<EmailTemplateResponse>>> reset(@PathVariable @Min(1) Long id) {
        return SecurityUtils.getCurrentUserId()
                .flatMap(userId -> service.resetToDefault(id, userId))
                .map(tpl -> ResponseEntity.ok(new ApiResponse<>("Email template reset successfully", tpl)));
    }

    @Operation(summary = "Render thử template với dữ liệu mẫu")
    @PostMapping("/preview")
    public Mono<ResponseEntity<ApiResponse<EmailTemplatePreviewResponse>>> preview(
            @Valid @RequestBody EmailTemplatePreviewRequest request) {
        return service.preview(request)
                .map(result -> ResponseEntity.ok(new ApiResponse<>("Preview rendered", result)));
    }

    @Operation(summary = "Render thử template theo vùng sửa được (ghép regions vào mẫu gốc)")
    @PostMapping("/{id}/preview")
    public Mono<ResponseEntity<ApiResponse<EmailTemplatePreviewResponse>>> previewRegions(
            @PathVariable @Min(1) Long id,
            @RequestBody PreviewEmailTemplateRegionsRequest request) {
        return service.previewRegions(id, request)
                .map(result -> ResponseEntity.ok(new ApiResponse<>("Preview rendered", result)));
    }
}
