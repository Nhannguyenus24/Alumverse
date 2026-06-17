package com.service.backend.event.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CancelTicketRequest {

    @NotBlank(message = "Cancel reason is required")
    @Schema(example = "Không thể tham dự do công tác")
    private String reason;
}
