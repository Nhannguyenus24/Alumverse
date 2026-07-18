package com.service.backend.chat.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PeerActiveStatusResponse {

    private Long peerMemberId;
    private boolean active;
}
