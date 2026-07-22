package com.service.backend.admin.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class AiProviderRequest {

    @NotBlank(message = "name không được để trống")
    @Size(max = 255)

    private String name;

    @Size(max = 255)


    private String providerType;

    @Size(max = 255)


    private String baseUrl;

    @Size(max = 255)


    private String apiKey;

    private Boolean enabled;

    private Integer priority;

    @Valid
    @Size(max = 100)

    private List<AiModelDto> models = new ArrayList<>();
}
