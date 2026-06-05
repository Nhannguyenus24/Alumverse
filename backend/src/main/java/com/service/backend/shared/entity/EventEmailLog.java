package com.service.backend.shared.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table("event_email_logs")
public class EventEmailLog {

    @Id
    private Long id;

    @Column("event_id")
    private Long eventId;

    @Column("sent_by")
    private Long sentBy;

    @Column("template_name")
    private String templateName;

    private String subject;

    @Column("recipient_count")
    private Integer recipientCount;

    @Column("sent_at")
    private LocalDateTime sentAt;
}
