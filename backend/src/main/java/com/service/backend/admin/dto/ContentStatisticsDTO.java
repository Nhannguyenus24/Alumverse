package com.service.backend.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContentStatisticsDTO {

    private Long totalNews;
    private Long totalAlumniPosts;
    private Long totalJobs;
    private Long activeJobs;
    private Long totalLearningResources;
    private Long totalAchievements;
    private Long newContentThisWeek;
    private Long newContentThisMonth;
}
