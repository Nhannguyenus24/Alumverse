package com.service.backend.eventmodule.domain.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table("events")
public class Event {

    @Id
    private Long id;

    @Column("organization_id")
    private Long organizationId;

    @Column("creator_member_id")
    private Long creatorMemberId;

    private String title;

    private String description;

    @Column("banner_url")
    private String bannerUrl;

    private String location;

    @Column("start_time")
    private LocalDateTime startTime;

    @Column("end_time")
    private LocalDateTime endTime;

    @Column("registration_start_at")
    private LocalDateTime registrationStartAt;

    @Column("registration_end_at")
    private LocalDateTime registrationEndAt;

    @Column("max_capacity")
    private Integer maxCapacity;

    @Column("interested_count")
    @Builder.Default
    private Integer interestedCount = 0;

    @Column("is_published")
    @Builder.Default
    private Boolean isPublished = false;

    @CreatedDate
    @Column("created_at")
    private LocalDateTime createdAt;
}
