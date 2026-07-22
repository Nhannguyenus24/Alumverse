package com.service.backend.forum.dto;

import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Min;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import io.swagger.v3.oas.annotations.media.Schema;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateForumTopicRequest {
    
    @Size(min = 5, max = 200, message = "Topic title must be between 5 and 200 characters")
    @Schema(example = "Cập nhật thông tin đăng ký môn học")
    @Size(max = 255)

    private String title;
    
    @Schema(example = "2")
    @NotNull

    @Min(value = 1)

    private Integer categoryId;
}
