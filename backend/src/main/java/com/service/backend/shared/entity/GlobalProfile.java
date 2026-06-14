package com.service.backend.shared.entity;

import java.time.LocalDate;
import java.time.LocalDateTime;

import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.annotation.Transient;
import org.springframework.data.domain.Persistable;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table("global_profiles")
public class GlobalProfile implements Persistable<Integer> {

    @Id
    @Column("user_id")
    private Integer userId;

    @Column("full_name")
    private String fullName;

    private String phone;
    
    private String bio;
    
    private LocalDate dob;
    
    private String gender;
    
    private String settings;

    @LastModifiedDate
    @Column("updated_at")
    private LocalDateTime updatedAt;

    @Transient
    @Builder.Default
    private boolean isNew = true;

    @Override
    public Integer getId() {
        return userId;
    }

    @Override
    public boolean isNew() {
        return isNew;
    }
}
