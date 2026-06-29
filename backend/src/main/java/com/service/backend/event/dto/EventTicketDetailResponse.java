package com.service.backend.event.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.service.backend.shared.entity.EventTicket;
import com.service.backend.shared.enums.Status;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * Ticket payload returned to clients. Carries everything the legacy {@code EventTicket} entity did
 * (same field names, so existing UI keeps working) plus two additions:
 * <ul>
 *   <li>{@code qrToken} — the encrypted JWE the client renders as the QR (replaces the plaintext code);</li>
 *   <li>{@code attendee*} — the holder's profile, populated on check-in / single-ticket lookup so
 *       staff can verify the person.</li>
 * </ul>
 */
@Data
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class EventTicketDetailResponse {

    private Long id;
    private Long eventId;
    private String ticketCode;
    private Status status;
    private LocalDateTime registeredAt;
    private LocalDateTime checkedInAt;
    private String cancelReason;
    private String rejectReason;

    private Long memberId;
    private String guestName;
    private String guestEmail;
    private String guestPhone;
    private List<Map<String, Object>> registrationAnswers;

    /** Encrypted QR payload the client renders (no plaintext ticket code). */
    private String qrToken;

    /** Holder's display profile — populated for check-in / single-ticket lookup. */
    private String attendeeName;
    private String attendeeEmail;
    private String attendeeAvatarUrl;

    public static EventTicketDetailResponseBuilder fromTicket(EventTicket t) {
        return EventTicketDetailResponse.builder()
                .id(t.getId())
                .eventId(t.getEventId())
                .ticketCode(t.getTicketCode())
                .status(t.getStatus())
                .registeredAt(t.getRegisteredAt())
                .checkedInAt(t.getCheckedInAt())
                .cancelReason(t.getCancelReason())
                .rejectReason(t.getRejectReason())
                .memberId(t.getMemberId())
                .guestName(t.getGuestName())
                .guestEmail(t.getGuestEmail())
                .guestPhone(t.getGuestPhone())
                .registrationAnswers(t.getRegistrationAnswers());
    }
}
