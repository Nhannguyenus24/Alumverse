package com.service.backend.eventmodule.presentation.dto.request;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.validator.constraints.URL;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateEventRequest {

    @NotBlank()
    @Size(min = 3, max = 255)
    private String title;

    @Size(max = 5000)
    private String description;

    @URL()
    private String bannerUrl;

    @Size(max = 500)
    private String location;

    @NotNull()
    private LocalDateTime startTime;

    @NotNull()
    private LocalDateTime endTime;

    private LocalDateTime registrationStartAt;

    private LocalDateTime registrationEndAt;

    @Min(value = 1)
    private Integer maxCapacity;
}
