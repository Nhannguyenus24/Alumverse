package com.service.backend.shared.entity;

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

import com.service.backend.shared.enums.Status;
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



    @Column("rating_avg")
    @Builder.Default
    private BigDecimal ratingAvg = BigDecimal.ZERO;

    @Column("total_sessions")
    @Builder.Default
    private Integer totalSessions = 0;

    @Column("status")
    @Builder.Default
    private Status status = Status.DRAFT;

    @Column("review_note")
    private String reviewNote;

    @Column("reviewed_at")
    private LocalDateTime reviewedAt;

    @Column("reviewed_by")
    private Integer reviewedBy;


    @Column("default_meeting_link")
    private String defaultMeetingLink;

    @Column("booking_window_settings")
    private String bookingWindowSettings;

    @Column("extended_profile")
    private String extendedProfile;

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
