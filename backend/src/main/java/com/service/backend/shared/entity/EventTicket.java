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
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.core.type.TypeReference;
import com.service.backend.shared.utils.JsonUtils;
import java.time.LocalDateTime;
import java.util.List;

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

    @JsonIgnore
    @Column("registration_answers")
    private String registrationAnswersJson;

    @Column("cancel_reason")
    private String cancelReason;

    @JsonProperty("registrationAnswers")
    public List<java.util.Map<String, Object>> getRegistrationAnswers() {
        if (registrationAnswersJson == null || registrationAnswersJson.isBlank()) return null;
        return JsonUtils.fromJson(registrationAnswersJson, new TypeReference<List<java.util.Map<String, Object>>>() {});
    }

    public void setRegistrationAnswersJson(String json) {
        this.registrationAnswersJson = json;
    }

    public void setRegistrationAnswersFromObject(Object answers) {
        this.registrationAnswersJson = answers == null ? null : JsonUtils.toJson(answers);
    }
}
