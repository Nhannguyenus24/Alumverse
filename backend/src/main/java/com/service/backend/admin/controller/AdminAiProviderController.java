package com.service.backend.admin.controller;

import com.service.backend.admin.dto.AiProviderRequest;
import com.service.backend.admin.dto.AiProviderResponse;
import com.service.backend.admin.service.AdminAiProviderService;
import com.service.backend.shared.dto.ApiResponse;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

import java.util.List;

@Tag(name = "Admin > AI Providers", description = "Cấu hình động provider/model AI (chỉ ADMIN)")
@RestController
@RequestMapping("/api/admin/ai-providers")
@Validated
@PreAuthorize("hasRole('ADMIN')")
public class AdminAiProviderController {

    private final AdminAiProviderService service;

    public AdminAiProviderController(AdminAiProviderService service) {
        this.service = service;
    }

    @Operation(summary = "Danh sách AI provider kèm model (key đã được che)")
    @GetMapping
    public Mono<ResponseEntity<ApiResponse<List<AiProviderResponse>>>> getAll() {
        return service.getAll()
                .map(list -> ResponseEntity.ok(new ApiResponse<>("AI providers retrieved successfully", list)));
    }

    @Operation(summary = "Chi tiết một AI provider")
    @GetMapping("/{id}")
    public Mono<ResponseEntity<ApiResponse<AiProviderResponse>>> getById(@PathVariable @Min(1) Integer id) {
        return service.getById(id)
                .map(p -> ResponseEntity.ok(new ApiResponse<>("AI provider retrieved successfully", p)));
    }

    @Operation(summary = "Tạo AI provider mới (key được mã hóa trước khi lưu)")
    @PostMapping
    public Mono<ResponseEntity<ApiResponse<AiProviderResponse>>> create(
            @Valid @RequestBody AiProviderRequest request) {
        return service.create(request)
                .map(p -> ResponseEntity.ok(new ApiResponse<>("AI provider created successfully", p)));
    }

    @Operation(summary = "Cập nhật AI provider + model (để trống key = giữ key cũ)")
    @PutMapping("/{id}")
    public Mono<ResponseEntity<ApiResponse<AiProviderResponse>>> update(
            @PathVariable @Min(1) Integer id,
            @Valid @RequestBody AiProviderRequest request) {
        return service.update(id, request)
                .map(p -> ResponseEntity.ok(new ApiResponse<>("AI provider updated successfully", p)));
    }

    @Operation(summary = "Xóa AI provider (xóa luôn model của nó)")
    @DeleteMapping("/{id}")
    public Mono<ResponseEntity<ApiResponse<Void>>> delete(@PathVariable @Min(1) Integer id) {
        return service.delete(id)
                .thenReturn(ResponseEntity.ok(new ApiResponse<>("AI provider deleted successfully", null)));
    }

    @Operation(summary = "Gọi thử một model để kiểm tra key/endpoint còn sống")
    @PostMapping("/{id}/test")
    public Mono<ResponseEntity<ApiResponse<String>>> test(
            @PathVariable @Min(1) Integer id,
            @RequestParam String model) {
        return service.test(id, model)
                .map(reply -> ResponseEntity.ok(new ApiResponse<>("Test succeeded", reply)));
    }
}
