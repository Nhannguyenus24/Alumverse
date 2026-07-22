package com.service.backend.mentorship.dto;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateMenteeProfileRequest {

    @NotBlank
    @Size(max = 5000)
    @Size(max = 255)

    private String mentoringGoal;

    @NotBlank
    @Size(max = 255)
    @Size(max = 255)

    private String major;

    @NotBlank
    @Size(max = 50)
    @Size(max = 255)

    private String academicYear;

    @Size(max = 2000)
    @Size(max = 255)

    private String interests;

    @AssertTrue(message = "User must accept mentorship terms")
    private Boolean termsAccepted;
}
