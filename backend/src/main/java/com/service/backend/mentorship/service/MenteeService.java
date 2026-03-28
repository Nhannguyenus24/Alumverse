package com.service.backend.mentorship.service;

import com.service.backend.mentorship.dao.*;
import com.service.backend.mentorship.dto.*;
import com.service.backend.mentorship.entity.MentorshipSession;
import com.service.backend.mentorship.entity.SessionFeedback;
import com.service.backend.shared.dto.PaginatedResponse;
import com.service.backend.shared.constants.ErrorCode;
import com.service.backend.shared.exception.ApplicationException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MenteeService {

    private final MentorProfileR2dbcRepository profileRepository;
    private final MentorExpertiseR2dbcRepository expertiseRepository;
    private final MentorAvailabilityR2dbcRepository availabilityRepository;
    private final MentorshipSessionR2dbcRepository sessionRepository;
    private final SessionFeedbackR2dbcRepository feedbackRepository;

    private static final Integer MOCK_MEMBER_ID = 2;

    // ===================== BROWSE MENTORS =====================

    public Mono<PaginatedResponse<MentorProfileResponse>> getApprovedMentors(int page, int limit) {
        int offset = page * limit;
        return profileRepository.findApprovedMentors(limit, offset)
                .collectList()
                .zipWith(profileRepository.countApprovedMentors())
                .map(tuple -> PaginatedResponse.of(
                        tuple.getT1().stream().map(MentorProfileResponse::from).toList(),
                        tuple.getT2(), page, limit
                ));
    }

    public Mono<MentorProfileResponse> getMentorProfile(Integer mentorMemberId) {
        return profileRepository.findById(mentorMemberId)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.MENTOR_PROFILE_NOT_FOUND, "Mentor profile not found")))
                .map(MentorProfileResponse::from);
    }

    public Mono<PaginatedResponse<MentorProfileResponse>> searchMentors(String keyword, int page, int limit) {
        int offset = page * limit;
        return profileRepository.searchMentors(keyword, limit, offset)
                .collectList()
                .zipWith(profileRepository.countSearchMentors(keyword))
                .map(tuple -> PaginatedResponse.of(
                        tuple.getT1().stream().map(MentorProfileResponse::from).toList(),
                        tuple.getT2(), page, limit
                ));
    }

    public Mono<PaginatedResponse<MentorProfileResponse>> filterMentors(
            String search, String expertise, BigDecimal minRating, boolean hasAvailability, int page, int limit) {
        int offset = page * limit;
        return profileRepository.filterMentors(search, expertise, minRating, hasAvailability, limit, offset)
                .collectList()
                .zipWith(profileRepository.countFilterMentors(search, expertise, minRating, hasAvailability))
                .map(tuple -> PaginatedResponse.of(
                        tuple.getT1().stream().map(MentorProfileResponse::from).toList(),
                        tuple.getT2(), page, limit
                ));
    }

    public Mono<List<MentorExpertiseResponse>> getMentorExpertise(Integer mentorMemberId) {
        return expertiseRepository.findByMentorMemberId(mentorMemberId)
                .map(MentorExpertiseResponse::from)
                .collectList();
    }

    public Mono<List<MentorAvailabilityResponse>> getMentorAvailableSlots(Integer mentorMemberId) {
        return availabilityRepository.findAvailableSlots(mentorMemberId, LocalDateTime.now())
                .map(MentorAvailabilityResponse::from)
                .collectList();
    }

    // ===================== BOOK SESSION =====================

    public Mono<MentorshipSessionResponse> bookSession(BookSessionRequest request) {
        return availabilityRepository.findById(request.getAvailabilityId())
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.AVAILABILITY_NOT_FOUND, "Availability slot not found")))
                .flatMap(availability -> {
                    if (!"Available".equals(availability.getStatus())) {
                        return Mono.error(new ApplicationException(ErrorCode.AVAILABILITY_NOT_AVAILABLE, "This time slot is no longer available"));
                    }

                    MentorshipSession session = MentorshipSession.builder()
                            .availabilityId(request.getAvailabilityId())
                            .menteeMemberId(MOCK_MEMBER_ID)
                            .status("Pending")
                            .bookingNote(request.getBookingNote())
                            .createdAt(LocalDateTime.now())
                            .build();

                    return availabilityRepository.updateStatus(availability.getId(), "Booked")
                            .then(sessionRepository.save(session));
                })
                .map(MentorshipSessionResponse::from);
    }

    // ===================== MY SESSIONS (Mentee view) =====================

    public Mono<PaginatedResponse<MentorshipSessionResponse>> getMySessions(int page, int limit) {
        int offset = page * limit;
        return sessionRepository.findByMenteeMemberId(MOCK_MEMBER_ID, limit, offset)
                .collectList()
                .zipWith(sessionRepository.countByMenteeMemberId(MOCK_MEMBER_ID))
                .map(tuple -> PaginatedResponse.of(
                        tuple.getT1().stream().map(MentorshipSessionResponse::from).toList(),
                        tuple.getT2(), page, limit
                ));
    }

    public Mono<PaginatedResponse<MentorshipSessionResponse>> filterMySessions(
            LocalDate date, String mentorName, int page, int limit) {
        int offset = page * limit;
        return sessionRepository.filterSessionsByMentee(MOCK_MEMBER_ID, date, mentorName, limit, offset)
                .collectList()
                .zipWith(sessionRepository.countFilterSessionsByMentee(MOCK_MEMBER_ID, date, mentorName))
                .map(tuple -> PaginatedResponse.of(
                        tuple.getT1().stream().map(MentorshipSessionResponse::from).toList(),
                        tuple.getT2(), page, limit
                ));
    }

    public Mono<MentorshipSessionResponse> getSessionById(Integer sessionId) {
        return sessionRepository.findById(sessionId)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.SESSION_NOT_FOUND, "Session not found with id: " + sessionId)))
                .map(MentorshipSessionResponse::from);
    }

    public Mono<MentorshipSessionResponse> cancelSession(Integer sessionId) {
        return sessionRepository.findById(sessionId)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.SESSION_NOT_FOUND, "Session not found with id: " + sessionId)))
                .flatMap(session -> {
                    if ("Cancelled".equals(session.getStatus())) {
                        return Mono.error(new ApplicationException(ErrorCode.SESSION_ALREADY_CANCELLED, "Session is already cancelled"));
                    }
                    return availabilityRepository.updateStatus(session.getAvailabilityId(), "Available")
                            .then(sessionRepository.updateStatus(sessionId, "Cancelled"))
                            .then(sessionRepository.findById(sessionId));
                })
                .map(MentorshipSessionResponse::from);
    }

    // ===================== FEEDBACK =====================

    public Mono<SessionFeedbackResponse> createFeedback(Integer sessionId, CreateFeedbackRequest request) {
        return sessionRepository.findById(sessionId)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.SESSION_NOT_FOUND, "Session not found")))
                .flatMap(session -> {
                    if (!"Completed".equals(session.getStatus())) {
                        return Mono.error(new ApplicationException(ErrorCode.SESSION_NOT_COMPLETED, "Can only provide feedback for completed sessions"));
                    }
                    return feedbackRepository.existsBySessionId(sessionId)
                            .flatMap(exists -> {
                                if (Boolean.TRUE.equals(exists)) {
                                    return Mono.error(new ApplicationException(ErrorCode.FEEDBACK_ALREADY_EXISTS, "Feedback already exists for this session"));
                                }

                                SessionFeedback feedback = SessionFeedback.builder()
                                        .sessionId(sessionId)
                                        .menteeMemberId(MOCK_MEMBER_ID)
                                        .rating(request.getRating())
                                        .comment(request.getComment())
                                        .isPublic(request.getIsPublic() != null ? request.getIsPublic() : true)
                                        .createdAt(LocalDateTime.now())
                                        .build();

                                return feedbackRepository.save(feedback);
                            });
                })
                .map(SessionFeedbackResponse::from);
    }

    public Mono<PaginatedResponse<SessionFeedbackResponse>> getMentorFeedbacks(Integer mentorMemberId, int page, int limit) {
        return feedbackRepository.findPublicFeedbacksByMentorId(mentorMemberId, limit, page * limit)
                .collectList()
                .zipWith(feedbackRepository.countPublicFeedbacksByMentorId(mentorMemberId))
                .map(tuple -> PaginatedResponse.of(
                        tuple.getT1().stream().map(SessionFeedbackResponse::from).toList(),
                        tuple.getT2(), page, limit
                ));
    }
}
