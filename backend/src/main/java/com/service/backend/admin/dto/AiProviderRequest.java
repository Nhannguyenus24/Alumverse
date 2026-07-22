package com.service.backend.admin.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class AiProviderRequest {

    @NotBlank(message = "name không được để trống")
    private String name;

    private String providerType;

    private String baseUrl;

    private String apiKey;

    private Boolean enabled;

    private Integer priority;

    @Valid
    private List<AiModelDto> models = new ArrayList<>();
}
