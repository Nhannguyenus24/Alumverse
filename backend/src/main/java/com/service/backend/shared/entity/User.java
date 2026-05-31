package com.service.backend.shared.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import com.service.backend.shared.enums.UserRole;
import com.service.backend.shared.enums.UserStatus;

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

    @Column("user_name")
    private String userName;

    @Column("status")
    private UserStatus status;

    @Column("role")
    private UserRole role;

    @Column("avatar_url")
    private String avatarUrl;

    @Column("created_at")
    private LocalDateTime createdAt;

    @Column("updated_at")
    private LocalDateTime updatedAt;
}
