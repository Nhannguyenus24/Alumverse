package com.service.backend.forum.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreatePollRequest {
    private Integer topicId;
    private Integer organizationId;
    private Integer createdByMemberId;
    private String title;
    private String description;
    private Boolean allowMultipleVotes;
    private java.util.List<String> options;
}
