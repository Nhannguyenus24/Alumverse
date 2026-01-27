package com.service.backend.forum.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateForumPostRequest {
    
    @NotNull(message = "Topic ID is required")
    private Integer topicId;
    
    @NotNull(message = "Author member ID is required")
    private Integer authorMemberId;
    
    @NotBlank(message = "Post content is required")
    @Size(min = 1, max = 10000, message = "Post content must be between 1 and 10000 characters")
    private String content;
    
    private Integer answerToPostId;
}
