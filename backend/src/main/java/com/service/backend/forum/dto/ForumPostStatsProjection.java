package com.service.backend.forum.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ForumPostStatsProjection {
    private Long totalPosts;
    private Long bannedPosts;
    private Long newPostsToday;
}
