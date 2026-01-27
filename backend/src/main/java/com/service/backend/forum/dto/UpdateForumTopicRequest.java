package com.service.backend.forum.dto;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateForumTopicRequest {
    
    @Size(min = 5, max = 200, message = "Topic title must be between 5 and 200 characters")
    private String title;
    
    private Integer categoryId;
}
