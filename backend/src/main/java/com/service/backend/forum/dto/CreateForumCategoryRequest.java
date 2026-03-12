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
public class CreateForumCategoryRequest {
    
    @NotNull(message = "Organization ID is required")
    @Min(value = 1, message = "Organization ID must be greater than 0")
    @Schema(example = "1")
    private Integer organizationId;
    
    @NotBlank(message = "Category name is required")
    @Size(min = 3, max = 100, message = "Category name must be between 3 and 100 characters")
    @Schema(example = "Thông báo chung")
    private String name;
    
    @Size(max = 500, message = "Description must not exceed 500 characters")
    @Schema(example = "Nơi đăng các thông báo quan trọng cho toàn trường.")
    private String description;
}
