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
public class CreateForumTopicRequest {
    
    @NotNull(message = "Organization ID is required")
    private Integer organizationId;
    
    @NotBlank(message = "Topic title is required")
    @Size(min = 5, max = 200, message = "Topic title must be between 5 and 200 characters")
    private String title;
    
    @NotNull(message = "Creator member ID is required")
    private Integer createdByMemberId;
    
    @NotNull(message = "Category ID is required")
    private Integer categoryId;
}
