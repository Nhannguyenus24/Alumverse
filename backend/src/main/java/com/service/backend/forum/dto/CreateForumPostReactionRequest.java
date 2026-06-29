package com.service.backend.forum.dto;

import jakarta.validation.constraints.NotNull;
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
    private Integer postId;
}
