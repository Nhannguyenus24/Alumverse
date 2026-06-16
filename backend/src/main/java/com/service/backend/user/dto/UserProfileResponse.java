package com.service.backend.user.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileResponse {
    private Integer userId;
    private String email;
    private String studentId;
    private String role;
    private String status;
    private String avatarUrl;
    private LocalDateTime createdAt;

    private String fullName;
    private String phone;
    private String bio;
    private LocalDate dob;
    private String gender;
    private LocalDateTime profileUpdatedAt;
}
