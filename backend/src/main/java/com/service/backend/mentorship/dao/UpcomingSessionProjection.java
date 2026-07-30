package com.service.backend.mentorship.dao;

import java.time.LocalDateTime;

public interface UpcomingSessionProjection {
    Integer getId();
    String getMentorName();
    String getMenteeName();
    LocalDateTime getSessionTime();
    String getStatus();
}
