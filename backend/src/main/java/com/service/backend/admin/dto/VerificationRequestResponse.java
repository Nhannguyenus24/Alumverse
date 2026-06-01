package com.service.backend.admin.dto;

import com.service.backend.shared.enums.DocumentType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VerificationRequestResponse {
    private Integer id;
    private Integer memberId;
    private String email;
    private String userName;
    private String documentUrl;
    private DocumentType documentType;
    private String status;
    private String adminNote;
    private Integer reviewedByMemberId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
