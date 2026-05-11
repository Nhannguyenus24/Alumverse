package com.service.backend.mentorship.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookSessionRequest {

    @NotNull
    @Min(1)
    private Integer availabilityId;

    @Size(max = 2000)
    private String bookingNote;

    @NotBlank
    @Pattern(regexp = "CAREER|ACADEMIC|SOFT_SKILLS",
            message = "sessionType must be one of: CAREER, ACADEMIC, SOFT_SKILLS")
    private String sessionType;

    @NotBlank
    @Size(max = 2000)
    private String introduction;

    @Size(max = 5000)
    private String description;

    @Size(max = 500)
    private String cvUrl;
}
