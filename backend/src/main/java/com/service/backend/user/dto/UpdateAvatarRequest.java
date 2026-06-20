package com.service.backend.user.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateAvatarRequest {

    @NotBlank(message = "Avatar URL is required")
    @Schema(
            description = "URL of the uploaded avatar image (from POST /api/images/upload)",
            example = "/images/abc123.webp"
    )
    private String avatarUrl;
}
