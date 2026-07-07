package com.service.backend.admin.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class ActivityItemDTO {
    private Long id;
    private LocalDateTime timestamp;
    private Integer adminUserId;
    private String adminFullName;
    private String adminEmail;
    private Integer targetUserId;
    private String action;
    private String resourceType;
    private String resourceId;
    private String metadata;
}
