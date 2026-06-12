package com.service.backend.mentorship.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Mentor proposes a new time when postponing a confirmed session.
 * The mentee then accepts (slot moved to the proposed time) or rejects.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PostponeSessionRequest {

    private String reason;

    @NotNull
    private LocalDateTime proposedStartTime;

    @NotNull
    private LocalDateTime proposedEndTime;
}
