package com.service.backend.user.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import jakarta.validation.constraints.*;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateCoverRequest {

    @Schema(
            description = "Base64 of the cover image (optionally with data:image/...;base64, header). "
                    + "It is converted to WebP and stored server-side.",
            example = "data:image/png;base64,iVBORw0KGgo..."
    )
    @Size(max = 255)

    private String coverBase64;
}
