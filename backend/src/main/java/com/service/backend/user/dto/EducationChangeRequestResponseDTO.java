package com.service.backend.user.dto;

import java.time.LocalDateTime;
import java.util.Map;

import com.service.backend.shared.enums.Status;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class EducationChangeRequestResponseDTO {

    private Integer id;
    private Integer memberId;
    private Integer organizationId;
    private Map<String, Object> oldData;
    private Map<String, Object> newData;
    private Status status;
    private String adminNote;
    private LocalDateTime createdAt;
    private LocalDateTime reviewedAt;
}
