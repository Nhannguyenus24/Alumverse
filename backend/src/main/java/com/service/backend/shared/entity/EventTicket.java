package com.service.backend.shared.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import com.service.backend.shared.enums.Status;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table("event_tickets")
public class EventTicket {

    @Id
    private Long id;

    @Column("event_id")
    private Long eventId;

    @Column("member_id")
    private Long memberId;

    @Column("guest_name")
    private String guestName;

    @Column("guest_email")
    private String guestEmail;

    @Column("guest_phone")
    private String guestPhone;

    @Column("ticket_code")
    private String ticketCode;

    private Status status;

    @CreatedDate
    @Column("registered_at")
    private LocalDateTime registeredAt;

    @Column("checked_in_at")
    private LocalDateTime checkedInAt;

    @Column("reviewed_by")
    private Long reviewedBy;

    @Column("reviewed_at")
    private LocalDateTime reviewedAt;

    @Column("reject_reason")
    private String rejectReason;
}
