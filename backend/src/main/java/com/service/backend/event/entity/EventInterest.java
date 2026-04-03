package com.service.backend.event.entity;

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
@Table("event_interests")
public class EventInterest {

    @Id
    private Long id;

    @Column("event_id")
    private Long eventId;

    @Column("member_id")
    private Long memberId;

    @CreatedDate
    @Column("created_at")
    private LocalDateTime createdAt;
}
