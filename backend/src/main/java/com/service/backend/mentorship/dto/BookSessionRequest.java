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
    @NotNull

    @Min(value = 1)

    private Integer availabilityId;

    @Size(max = 2000)
    @Size(max = 255)

    private String bookingNote;

    @NotBlank
    @Pattern(regexp = "CAREER|ACADEMIC|SOFT_SKILLS",
            message = "sessionType must be one of: CAREER, ACADEMIC, SOFT_SKILLS")
    @Size(max = 255)

    private String sessionType;

    @NotBlank
    @Size(max = 2000)
    @Size(max = 255)

    private String introduction;

    @Size(max = 5000)
    @Size(max = 255)

    private String description;

    @Size(max = 500)
    @Size(max = 255)

    private String cvUrl;

    /**
     * Optional base64-encoded CV file. When present, the backend stores the file and persists the
     * resulting URL, taking precedence over {@link #cvUrl}. Requires {@link #cvFileName}.
     */
    @Size(max = 255)

    private String cvBase64;

    /** Original file name of {@link #cvBase64}; its extension drives type/size validation. */
    @Size(max = 255)
    @Size(max = 255)

    private String cvFileName;
}
