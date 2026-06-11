package com.service.backend.chat.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BlockStatusResponse {

    private Long targetMemberId;
    private boolean blocked;
}
