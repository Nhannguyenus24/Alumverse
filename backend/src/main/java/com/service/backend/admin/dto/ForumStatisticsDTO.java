package com.service.backend.admin.dto;

import java.time.LocalDateTime;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ForumStatisticsDTO {

    // ===== Overview =====
    private Long totalTopics;
    private Long totalPosts;
    private Long totalCategories;
    private Long bannedPosts;

    // ===== Today's Activity =====
    private Long newTopicsToday;
    private Long newPostsToday;

    // ===== Most Popular Topic (most posts) =====
    private TopicSummary mostPopularTopic;

    // ===== Most Popular Category (most posts in topics under it) =====
    private CategorySummary mostPopularCategory;

    // ===== Ghost Topics (created > 7 days ago with 0 replies) =====
    private List<GhostTopicSummary> ghostTopics;

    // ---------- Inner DTOs ----------

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TopicSummary {
        private Integer topicId;
        private String title;
        private Integer categoryId;
        private Long postCount;
        private Integer viewCount;
        private LocalDateTime createdAt;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CategorySummary {
        private Integer categoryId;
        private String categoryName;
        private Long topicCount;
        private Long postCount;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class GhostTopicSummary {
        private Integer topicId;
        private String title;
        private String categoryName;
        private Integer viewCount;
        private LocalDateTime createdAt;
    }
}
