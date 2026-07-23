package com.service.backend.admin.controller;

import com.service.backend.admin.dto.FitBotKnowledgeRequest;
import com.service.backend.admin.dto.FitBotKnowledgeResponse;
import com.service.backend.admin.service.AdminFitBotKnowledgeService;
import com.service.backend.shared.dto.ApiResponse;
import com.service.backend.shared.utils.SecurityUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

import java.util.List;

@Tag(name = "Admin > FitBot Knowledge", description = "Quản lý knowledge data cho FitBot (chỉ ADMIN)")
@RestController
@RequestMapping("/api/admin/fitbot-knowledge")
@Validated
@PreAuthorize("hasRole('ADMIN')")
public class AdminFitBotKnowledgeController {

    private final AdminFitBotKnowledgeService service;

    public AdminFitBotKnowledgeController(AdminFitBotKnowledgeService service) {
        this.service = service;
    }

    @Operation(summary = "Danh sách FitBot knowledge documents")
    @GetMapping
    public Mono<ResponseEntity<ApiResponse<List<FitBotKnowledgeResponse>>>> getAll() {
        return service.getAll()
                .map(list -> ResponseEntity.ok(new ApiResponse<>("FitBot knowledge retrieved successfully", list)));
    }

    @Operation(summary = "Chi tiết FitBot knowledge document")
    @GetMapping("/{id}")
    public Mono<ResponseEntity<ApiResponse<FitBotKnowledgeResponse>>> getById(@PathVariable @Min(1) Long id) {
        return service.getById(id)
                .map(doc -> ResponseEntity.ok(new ApiResponse<>("FitBot knowledge retrieved successfully", doc)));
    }

    @Operation(summary = "Tạo FitBot knowledge document")
    @PostMapping
    public Mono<ResponseEntity<ApiResponse<FitBotKnowledgeResponse>>> create(
            @Valid @RequestBody FitBotKnowledgeRequest request) {
        return SecurityUtils.getCurrentUserId()
                .flatMap(userId -> service.create(request, userId))
                .map(doc -> ResponseEntity.ok(new ApiResponse<>("FitBot knowledge created successfully", doc)));
    }

    @Operation(summary = "Cập nhật FitBot knowledge document")
    @PutMapping("/{id}")
    public Mono<ResponseEntity<ApiResponse<FitBotKnowledgeResponse>>> update(
            @PathVariable @Min(1) Long id,
            @Valid @RequestBody FitBotKnowledgeRequest request) {
        return SecurityUtils.getCurrentUserId()
                .flatMap(userId -> service.update(id, request, userId))
                .map(doc -> ResponseEntity.ok(new ApiResponse<>("FitBot knowledge updated successfully", doc)));
    }

    @Operation(summary = "Xóa FitBot knowledge document")
    @DeleteMapping("/{id}")
    public Mono<ResponseEntity<ApiResponse<Void>>> delete(@PathVariable @Min(1) Long id) {
        return service.delete(id)
                .thenReturn(ResponseEntity.ok(new ApiResponse<>("FitBot knowledge deleted successfully", null)));
    }

    @Operation(summary = "Sync một FitBot knowledge document sang vector store")
    @PostMapping("/{id}/sync")
    public Mono<ResponseEntity<ApiResponse<FitBotKnowledgeResponse>>> syncOne(@PathVariable @Min(1) Long id) {
        return service.syncOne(id)
                .map(doc -> ResponseEntity.ok(new ApiResponse<>("FitBot knowledge synced successfully", doc)));
    }

    @Operation(summary = "Sync toàn bộ FitBot knowledge sang vector store")
    @PostMapping("/sync-all")
    public Mono<ResponseEntity<ApiResponse<Integer>>> syncAll() {
        return service.syncAll()
                .map(count -> ResponseEntity.ok(new ApiResponse<>("FitBot knowledge sync completed", count)));
    }
}
