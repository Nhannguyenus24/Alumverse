package com.service.backend.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiProviderResponse {

    private Integer id;
    private String name;
    private String providerType;
    private String baseUrl;
    private String apiKeyMasked;
    private Boolean hasApiKey;
    private Boolean enabled;
    private Integer priority;
    private LocalDateTime quotaExhaustedAt;
    private List<AiModelDto> models;
}
