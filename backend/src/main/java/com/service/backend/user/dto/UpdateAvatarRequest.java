package com.service.backend.user.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateAvatarRequest {

    // Base64 grows ~33% over the raw bytes; bound to the WebFlux 50MB codec limit so oversized
    // payloads are rejected as 400 (not silently buffered). NOT a 255 cap — real images are large.
    @NotBlank
    @Size(max = 52_428_800)
    @Schema(
            description = "Base64 of the avatar image (optionally with data:image/...;base64, header). "
                    + "It is converted to WebP and stored server-side.",
            example = "data:image/png;base64,iVBORw0KGgo..."
    )
    private String avatarBase64;
}
