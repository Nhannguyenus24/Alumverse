package com.service.backend.domain.repository;

import com.service.backend.domain.entity.MentorProfile;
import com.service.backend.domain.entity.MentorExpertise;
import com.service.backend.domain.entity.MentorAvailability;
import com.service.backend.domain.entity.MentorshipSession;
import com.service.backend.domain.entity.SessionFeedback;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;

/**
 * Repository interface for mentorship operations
 */
public interface IMentorRepository {

    // Mentor Profile Management
    Mono<MentorProfile> createMentorProfile(MentorProfile profileData);
    Mono<MentorProfile> updateMentorProfile(Long memberId, MentorProfile profileData);
    Mono<MentorProfile> findMentorProfileByMemberId(Long memberId);
    Mono<Map<String, Object>> findAllMentorProfiles(Long organizationId, int page, int limit, Map<String, Object> filters);
    Mono<MentorProfile> approveMentorProfile(Long memberId);
    Mono<MentorProfile> updateMentorRating(Long memberId, BigDecimal newAvgRating, Integer totalSessions);

    // Mentor Expertise Management
    Mono<MentorExpertise> createExpertise(MentorExpertise expertiseData);
    Mono<MentorExpertise> updateExpertise(Long expertiseId, MentorExpertise expertiseData);
    Mono<Boolean> deleteExpertise(Long expertiseId);
    Flux<MentorExpertise> findExpertiseByMentor(Long mentorMemberId);
    Mono<Map<String, Object>> searchMentorsByExpertise(String topic, int page, int limit);

    // Availability Management
    Mono<MentorAvailability> createAvailability(MentorAvailability availabilityData);
    Mono<MentorAvailability> updateAvailability(Long availabilityId, MentorAvailability availabilityData);
    Mono<Boolean> deleteAvailability(Long availabilityId);
    Mono<MentorAvailability> findAvailabilityById(Long availabilityId);
    Flux<MentorAvailability> findAvailabilitiesByMentor(Long mentorMemberId, LocalDateTime startDate, LocalDateTime endDate);
    Flux<MentorAvailability> findAvailableSlots(Long mentorMemberId, LocalDateTime startDate, LocalDateTime endDate);
    Mono<MentorAvailability> updateAvailabilityStatus(Long availabilityId, String status);

    // Session Management
    Mono<MentorshipSession> createSession(MentorshipSession sessionData);
    Mono<MentorshipSession> updateSession(Long sessionId, MentorshipSession sessionData);
    Mono<MentorshipSession> cancelSession(Long sessionId);
    Mono<MentorshipSession> completeSession(Long sessionId);
    Mono<MentorshipSession> findSessionById(Long sessionId);
    Mono<Map<String, Object>> findSessionsByMentor(Long mentorMemberId, int page, int limit);
    Mono<Map<String, Object>> findSessionsByMentee(Long menteeMemberId, int page, int limit);
    Flux<MentorshipSession> findUpcomingSessions(Long memberId);

    // Feedback Management
    Mono<SessionFeedback> createFeedback(SessionFeedback feedbackData);
    Mono<SessionFeedback> updateFeedback(Long feedbackId, SessionFeedback feedbackData);
    Mono<SessionFeedback> findFeedbackBySession(Long sessionId);
    Mono<Map<String, Object>> findFeedbacksByMentor(Long mentorMemberId, int page, int limit, Boolean publicOnly);

    // Statistics
    Mono<Map<String, Object>> getMentorStatistics(Long mentorMemberId);
}
