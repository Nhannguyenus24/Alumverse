package com.service.backend.article.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateAlumniPostCommentRequest {

    private Integer alumniPostId;

    @NotNull(message = "Author member ID is required")
    @Min(value = 1, message = "Author member ID must be greater than 0")
    private Integer authorMemberId;

    @NotBlank(message = "Content is required")
    @Size(min = 1, max = 5000, message = "Content must be between 1 and 5000 characters")
    private String content;

    private Integer parentCommentId;
}
