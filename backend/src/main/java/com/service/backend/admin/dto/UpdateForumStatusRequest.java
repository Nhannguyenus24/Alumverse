package com.service.backend.admin.dto;

import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request to update the status of a forum topic or category.
 * Allowed values: PENDING (awaiting admin approval), ACTIVE (visible), INACTIVE (hidden).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateForumStatusRequest {
    @Pattern(regexp = "PENDING|ACTIVE|INACTIVE", message = "Status must be one of PENDING, ACTIVE, INACTIVE")
    private String status;
}
