package com.service.backend.forum.dto;

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
public class UpdateForumCategoryRequest {
    
    @Size(min = 3, max = 100, message = "Category name must be between 3 and 100 characters")
    @Schema(example = "Thông báo học vụ")
    @Size(max = 255)

    private String name;
    
    @Size(max = 500, message = "Description must not exceed 500 characters")
    @Schema(example = "Thông báo về lịch học, lịch thi, nghỉ học, ...")
    @Size(max = 255)

    private String description;
}
