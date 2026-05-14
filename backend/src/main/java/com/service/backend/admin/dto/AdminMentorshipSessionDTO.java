package com.service.backend.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminMentorshipSessionDTO {

    private Integer id;
    private Integer availabilityId;
    private Integer menteeMemberId;
    private String menteeName;
    private String menteeEmail;
    private Integer mentorMemberId;
    private String mentorName;
    private String mentorEmail;
    private String status;
    private String sessionType;
    private String bookingNote;
    private String introduction;
    private String description;
    private String meetingLink;
    private String cvUrl;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private LocalDateTime createdAt;
}
