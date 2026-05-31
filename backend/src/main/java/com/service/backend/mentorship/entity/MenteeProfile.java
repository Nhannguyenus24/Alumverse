package com.service.backend.mentorship.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.annotation.Transient;
import org.springframework.data.domain.Persistable;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table("mentee_profiles")
public class MenteeProfile implements Persistable<Integer> {

    @Id
    @Column("member_id")
    private Integer memberId;

    @Column("mentoring_goal")
    private String mentoringGoal;

    @Column("major")
    private String major;

    @Column("academic_year")
    private String academicYear;

    @Column("interests")
    private String interests;

    @Column("is_active")
    @Builder.Default
    private Boolean isActive = true;

    @CreatedDate
    @Column("created_at")
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column("updated_at")
    private LocalDateTime updatedAt;

    @Transient
    @Builder.Default
    private boolean isNew = true;

    @Override
    public Integer getId() {
        return memberId;
    }

    @Override
    public boolean isNew() {
        return isNew;
    }
}
