package com.service.backend.admin.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiModelDto {

    private Integer id;

    @NotBlank(message = "model_name không được để trống")
    private String modelName;

    private Integer priority;

    private Boolean enabled;
}
