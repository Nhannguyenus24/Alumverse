package com.service.backend.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * A single (name, value) data point. Maps 1:1 to the {@code { name, value }} shape
 * the frontend Chart component expects, so it is reused across every insight chart.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class StatPoint {
    private String name;
    private Long value;
}
