package com.service.backend.mentorship.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JoinSessionResponse {

    private Integer sessionId;
    private String status;
    private String meetingLink;
    private LocalDateTime joinedAt;
}
