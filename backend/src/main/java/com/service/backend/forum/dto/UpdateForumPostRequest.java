package com.service.backend.forum.dto;

import jakarta.validation.constraints.NotBlank;
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
public class UpdateForumPostRequest {
    
    @NotBlank(message = "Post content is required")
    @Size(min = 1, max = 10000, message = "Post content must be between 1 and 10000 characters")
    @Schema(example = "Bài viết được chỉnh sửa - bạn nào biết cách đăng ký môn học không?")
    @Size(max = 255)

    private String content;
}
