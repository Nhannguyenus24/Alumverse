package com.service.backend.shared.controller;

import com.service.backend.shared.dto.ApiResponse;
import com.service.backend.shared.service.FileUploadService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

@Tag(name = "System > Files", description = "API endpoints for handling generic file uploads")
@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
public class FileUploadController {

    private final FileUploadService fileUploadService;

    @PostMapping("/upload")
    @Operation(summary = "Upload a document (PDF/DOC/DOCX) as base64; returns the public URL")
    public Mono<ResponseEntity<ApiResponse<String>>> upload(@Valid @RequestBody FileUploadRequest request) {
        return fileUploadService
                .uploadBase64File(request.getBase64String(), request.getFileName())
                .map(url -> ResponseEntity.ok(new ApiResponse<>("File uploaded successfully", url)))
                .onErrorResume(IllegalArgumentException.class, e ->
                        Mono.just(ResponseEntity.badRequest()
                                .body(new ApiResponse<>(e.getMessage(), null))))
                .onErrorResume(e ->
                        Mono.just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                .body(new ApiResponse<>("Error uploading file: " + e.getMessage(), null))));
    }

    @Data
    public static class FileUploadRequest {
        // Bounded to the WebFlux 50MB codec limit; base64 is ~33% larger than the raw bytes.
        @NotBlank
        @Size(max = 52_428_800)
        private String base64String;

        @NotBlank
        @Size(max = 255)
        private String fileName;
    }
}
