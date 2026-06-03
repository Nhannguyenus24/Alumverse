package com.service.backend.chat.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NetworkMemberSearchItemResponse {

    private Integer userId;
    private String fullName;
    private String program;
    private String major;
    private Integer startYear;
    private String avatarUrl;
}
