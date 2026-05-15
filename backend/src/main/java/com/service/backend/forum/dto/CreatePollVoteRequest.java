package com.service.backend.forum.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreatePollVoteRequest {
    private Integer pollId;
    private Integer pollOptionId;
    private Integer memberId;
}
