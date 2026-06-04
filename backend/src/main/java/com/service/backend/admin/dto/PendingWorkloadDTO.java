package com.service.backend.admin.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PendingWorkloadDTO {
    private long pendingOCR;
    private long pendingReferrals;
    private long pendingMentorApplications;
    private long pendingForumPosts;
    private long pendingReports;
}
