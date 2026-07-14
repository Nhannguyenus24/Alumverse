package com.service.backend.shared.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CvExperienceEntry {
    private String title;
    private String company;
    private String period;
    private String description;
    // When true, this is an ongoing job: `period` holds only the start "MM/YYYY"
    // and the UI renders the end as the (dynamic) current month.
    private Boolean isCurrent;
}
