package com.service.backend.shared.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import com.service.backend.shared.enums.Status;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table("event_invitations")
public class EventInvitation {

    @Id
    private Long id;

    @Column("event_id")
    private Long eventId;

    @Column("member_id")
    private Long memberId;

    private String email;

    private String token;

    private Status status;

    @Column("invited_by")
    private Long invitedBy;

    @Column("invited_at")
    private LocalDateTime invitedAt;

    @Column("confirmed_at")
    private LocalDateTime confirmedAt;

    @Column("expires_at")
    private LocalDateTime expiresAt;
}
