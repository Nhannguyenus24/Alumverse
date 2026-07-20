package com.service.backend.shared.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Like {@link IdCountDTO} but for {@code Long}-keyed ids (e.g. bigint primary keys). */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LongIdCountDTO {
    private Long id;
    private Long count;
}
