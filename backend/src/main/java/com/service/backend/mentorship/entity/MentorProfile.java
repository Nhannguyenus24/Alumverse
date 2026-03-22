package com.service.backend.mentorship.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.Transient;
import org.springframework.data.domain.Persistable;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table("mentor_profiles")
public class MentorProfile implements Persistable<Integer> {

    @Id
    @Column("member_id")
    private Integer memberId;

    @Column("current_job_title")
    private String currentJobTitle;

    @Column("current_company")
    private String currentCompany;

    private String bio;

    @Column("rating_avg")
    @Builder.Default
    private BigDecimal ratingAvg = BigDecimal.ZERO;

    @Column("total_sessions")
    @Builder.Default
    private Integer totalSessions = 0;

    @Column("is_approved")
    @Builder.Default
    private Boolean isApproved = false;

    @CreatedDate
    @Column("created_at")
    private LocalDateTime createdAt;

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
