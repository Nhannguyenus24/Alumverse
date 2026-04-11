package com.service.backend.user.dto;

import java.time.LocalDateTime;

import com.service.backend.shared.enums.UserRole;
import com.service.backend.shared.enums.UserStatus;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for user profile response
 * Includes basic user information and global profile data
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserProfileResponse {
    
    private Integer id;
    
    private String email;
    
    private String userName;
    
    private UserRole role;
    
    private UserStatus status;
    
    private String avatarUrl;
    
    // Global profile fields
    private String fullName;
    
    private String phone;
    
    private String bio;
    
    private LocalDateTime createdAt;
    
    private LocalDateTime updatedAt;
}
