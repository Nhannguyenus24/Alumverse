package com.service.backend.forum.dto;

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
public class PollDTO {
    private Integer id;
    private Integer topicId;
    private Integer organizationId;
    private Integer createdByMemberId;
    private String title;
    private String description;
    private Boolean allowMultipleVotes;
    private Boolean isActive;
    private List<PollOptionDTO> options;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
