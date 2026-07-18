package com.service.backend.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminMenteeDTO {

    private Integer memberId;
    private String menteeName;
    private String menteeEmail;
    private String userStatus;

    private Long totalSessions;
    private Long completedSessions;
    private LocalDateTime lastSessionAt;
}
