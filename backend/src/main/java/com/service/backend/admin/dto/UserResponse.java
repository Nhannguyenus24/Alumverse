package com.service.backend.admin.dto;

import java.time.LocalDateTime;

import com.service.backend.shared.enums.UserRole;
import com.service.backend.shared.enums.UserStatus;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder(toBuilder = true)
public class UserResponse {
    private Integer id;
    private String email;
    private String userName;
    private UserStatus status;
    private UserRole role;
    private String avatarUrl;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    /** From global_profiles (admin list/detail enrichment). */
    private String fullName;
    /** Primary organization_members row (lowest id) for this user, if any. */
    private Integer organizationId;
    private String organizationName;
}
