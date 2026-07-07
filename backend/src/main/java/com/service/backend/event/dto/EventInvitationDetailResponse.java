package com.service.backend.event.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.service.backend.shared.entity.EventInvitation;
import com.service.backend.shared.enums.Status;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class EventInvitationDetailResponse {
    private Long id;
    private Long eventId;
    private Long memberId;
    private String email;
    private String token;
    private Status status;
    private Long invitedBy;
    private LocalDateTime invitedAt;
    private LocalDateTime confirmedAt;
    private LocalDateTime expiresAt;
    private String memberName;
    private String memberEmail;
    private String memberAvatarUrl;

    public static EventInvitationDetailResponseBuilder fromInvitation(EventInvitation invitation) {
        return EventInvitationDetailResponse.builder()
                .id(invitation.getId())
                .eventId(invitation.getEventId())
                .memberId(invitation.getMemberId())
                .email(invitation.getEmail())
                .token(invitation.getToken())
                .status(invitation.getStatus())
                .invitedBy(invitation.getInvitedBy())
                .invitedAt(invitation.getInvitedAt())
                .confirmedAt(invitation.getConfirmedAt())
                .expiresAt(invitation.getExpiresAt());
    }
}
