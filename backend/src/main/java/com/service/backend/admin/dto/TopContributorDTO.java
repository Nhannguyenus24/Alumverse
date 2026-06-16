package com.service.backend.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TopContributorDTO {
    private Integer memberId;
    private String studentId;
    private String email;
    private String avatarUrl;
    private Long postCount;
}
