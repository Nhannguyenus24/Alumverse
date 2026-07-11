package com.service.backend.forum.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ForumTopicStatsProjection {
    private Long totalTopics;
    private Long newTopicsToday;
}
