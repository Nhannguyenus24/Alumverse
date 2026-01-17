package com.service.backend.authmodule.domain.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table("global_profiles")
public class GlobalProfile {

    @Id
    @Column("user_id")
    private Long userId;

    @Column("full_name")
    private String fullName;

    private String phone;

    @Column("avatar_url")
    private String avatarUrl;

    private String bio;

    private LocalDate dob;

    private String gender;

    private String settings; // JSON stored as String
}
