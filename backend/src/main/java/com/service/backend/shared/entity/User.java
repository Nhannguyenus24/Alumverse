package com.service.backend.shared.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import com.service.backend.shared.enums.UserRole;
import com.service.backend.shared.enums.Status;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table("users")
public class User {
        
    @Id
    private Integer id;

    @Column("email")
    private String email;

    @Column("password_hash")
    private String passwordHash;

    @Column("status")
    private Status status;

    @Column("role")
    private UserRole role;

    @Column("avatar_url")
    private String avatarUrl;

    @Column("cover_url")
    private String coverUrl;

    @Column("full_name")
    private String fullName;

    @Column("phone")
    private String phone;

    @Column("bio")
    private String bio;

    @Column("dob")
    private LocalDate dob;

    @Column("gender")
    private String gender;

    @Column("settings")
    private String settings;

    @Column("must_change_password")
    private boolean mustChangePassword;

    @Column("current_job_title")
    private String currentJobTitle;

    @Column("current_company")
    private String currentCompany;

    @Column("links")
    private String links;

    @CreatedDate
    @Column("created_at")
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column("updated_at")
    private LocalDateTime updatedAt;
}
