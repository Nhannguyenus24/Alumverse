package com.service.backend.mentorship.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
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
}
