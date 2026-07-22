package com.service.backend.mentorship.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request body for ME-02 skill-tag extraction: a free-text description of a
 * mentor's experience or a mentee's learning needs.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExtractSkillsRequest {

    @NotBlank
    @Size(max = 5000)
    private String text;
}
