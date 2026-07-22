package com.service.backend.forum.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import io.swagger.v3.oas.annotations.media.Schema;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateForumPostRequest {
    
    @NotNull(message = "Topic ID is required")
    @Min(value = 1, message = "Topic ID must be greater than 0")
    @Schema(example = "5")
    @NotNull

    @Min(value = 1)

    private Integer topicId;
    
    @NotNull(message = "Author member ID is required")
    @Min(value = 1, message = "Author member ID must be greater than 0")
    @Schema(example = "1")
    @NotNull

    @Min(value = 1)

    private Integer authorMemberId;
    
    @NotBlank(message = "Post content is required")
    @Size(min = 1, max = 10000, message = "Post content must be between 1 and 10000 characters")
    @Schema(example = "Bạn nào biết cách đăng ký môn học không? Hướng dẫn giúp mình với!")
    @Size(max = 255)

    private String content;
    
    @Schema(example = "1")
    @NotNull

    @Min(value = 1)

    private Integer answerToPostId;
}
