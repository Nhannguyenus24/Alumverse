package com.service.backend.mentorship.dto;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateMentorProfileRequest {

    @Size(max = 255)
    private String currentJobTitle;

    @Size(max = 255)
    private String currentCompany;

    @Size(max = 5000)
    private String bio;
}
