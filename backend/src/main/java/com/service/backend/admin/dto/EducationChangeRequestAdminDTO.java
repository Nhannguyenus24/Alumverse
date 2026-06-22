package com.service.backend.admin.dto;

import java.time.LocalDateTime;
import java.util.Map;

import com.service.backend.shared.enums.Status;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class EducationChangeRequestAdminDTO {

    private Integer id;
    private Integer memberId;
    private Integer organizationId;
    private Map<String, Object> oldData;
    private Map<String, Object> newData;
    private Status status;
    private String adminNote;
    private Integer reviewedByUserId;
    private LocalDateTime createdAt;
    private LocalDateTime reviewedAt;

    // Member info
    private String memberStudentId;
    private String memberFullName;
}
