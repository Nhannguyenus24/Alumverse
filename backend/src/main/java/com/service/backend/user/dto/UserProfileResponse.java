package com.service.backend.user.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

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
    private String currentJobTitle;
    private String currentCompany;
    private String links;
    private LocalDateTime profileUpdatedAt;

    private String startedYear;
    private String graduatedYear;
    private String graduationStatus;
    private String program;
    private String major;
    private String faculty;
    private String department;
}
