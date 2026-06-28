package com.service.backend.shared.projection;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Generic "label -> count" projection used by admin insight aggregation queries
 * (e.g. distribution of a status column, a verification level, a login hour...).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class KeyCountProjection {
    private String key;
    private Long count;
}
