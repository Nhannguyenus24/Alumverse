package com.service.backend.forum.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Min;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateForumPostReactionRequest {
    @NotNull(message = "Post ID is required")
    @NotNull

    @Min(value = 1)

    private Integer postId;
    
    @NotNull(message = "Member ID is required")
    @NotNull

    @Min(value = 1)

    private Integer memberId;
}
