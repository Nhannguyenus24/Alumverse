package com.service.backend.shared.controller;

import com.service.backend.shared.dto.ApiResponse;
import com.service.backend.shared.service.ImageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * API Controller for handling Base64 image uploads.
 * <p>
 * Endpoints:
 * - POST /api/images/upload: Upload Base64 image and convert to WebP
 * - GET /api/images/health: Health check
 * </p>
 */
@RestController
@RequestMapping("/api/images")
@RequiredArgsConstructor
@Tag(name = "Image Management", description = "API for managing and uploading images")
public class ImageController {

    private final ImageService imageService;

    /**
     * Upload a Base64 image and convert to WebP format.
     * <p>
     * Request body example:
     * {
     *   "base64String": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA..."
     * }
     *
     * Response example:
     * {
     *   "success": true,
     *   "imageUrl": "http://localhost/images/550e8400-e29b-41d4-a716-446655440000.webp",
     *   "message": "Image uploaded successfully"
     * }
     * </p>
     *
     * @param request Object containing the base64String of the image
     * @return ResponseEntity with the URL of the uploaded image
     */
    @PostMapping("/upload")
    @Operation(
            summary = "Upload Base64 Image",
            description = "Upload an image in Base64 format and convert to WebP format"
    )
    public ResponseEntity<ApiResponse<String>> uploadImage(@RequestBody ImageUploadRequest request) {
        try {
            // Validate request
            if (request.getBase64String() == null || request.getBase64String().isEmpty()) {
                return ResponseEntity.badRequest().body(
                        new ApiResponse<>("Base64 string cannot be empty", null)
                );
            }

            // Upload image
            String imageUrl = imageService.uploadBase64Image(request.getBase64String());

            // Return response
            return ResponseEntity.ok(
                    new ApiResponse<>("Image uploaded successfully", imageUrl)
            );

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(
                    new ApiResponse<>("Invalid Base64 string: " + e.getMessage(), null)
            );
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                    new ApiResponse<>("Error processing image: " + e.getMessage(), null)
            );
        }
    }

    @lombok.Data
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class ImageUploadRequest {
        @Schema(
                description = "Base64 string of the image (may include header: data:image/png;base64,...)",
                example = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA..."
        )
        private String base64String;
    }
}
