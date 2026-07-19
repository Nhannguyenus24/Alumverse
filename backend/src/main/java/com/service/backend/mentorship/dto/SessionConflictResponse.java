package com.service.backend.mentorship.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SessionConflictResponse {

    private boolean hasConflict;
    private List<Conflict> conflicts;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Conflict {
        private Integer sessionId;
        private Integer mentorMemberId;
        private String mentorName;
        private LocalDateTime startTime;
        private LocalDateTime endTime;
    }
}
