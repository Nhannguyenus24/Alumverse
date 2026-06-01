package com.service.backend.mentorship.service;

import com.service.backend.mentorship.dao.*;
import com.service.backend.mentorship.dto.*;
import com.service.backend.shared.entity.MenteeProfile;
import com.service.backend.shared.entity.MentorshipSession;
import com.service.backend.shared.enums.MentorshipSessionType;
import com.service.backend.shared.enums.Status;
import com.service.backend.shared.entity.SessionFeedback;
import com.service.backend.shared.dao.UserDisplayInfo;
import com.service.backend.shared.dao.UserDisplayInfoRepository;
import com.service.backend.shared.dto.PaginatedResponse;
import com.service.backend.shared.entity.MentorExpertise;
import com.service.backend.shared.enums.ErrorCode;
import com.service.backend.shared.exception.ApplicationException;
import com.service.backend.shared.utils.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class MenteeService {

    private final MentorProfileR2dbcRepository profileRepository;
    private final MentorExpertiseR2dbcRepository expertiseRepository;
    private final MentorAvailabilityR2dbcRepository availabilityRepository;
    private final MentorshipSessionR2dbcRepository sessionRepository;
    private final SessionFeedbackR2dbcRepository feedbackRepository;
    private final UserDisplayInfoRepository userDisplayInfoRepository;
    private final MenteeProfileR2dbcRepository menteeProfileRepository;

    private Mono<Integer> currentMemberId() {
        return SecurityUtils.getCurrentUserId().map(Long::intValue);
    }

    private Mono<MentorshipSessionResponse> enrich(MentorshipSession session) {
        return enrichAll(List.of(session)).map(list -> list.get(0));
    }

    private Mono<List<MentorshipSessionResponse>> enrichAll(List<MentorshipSession> sessions) {
        if (sessions.isEmpty()) return Mono.just(List.of());

        // 1. Build base responses, lookup availability for each session (sequential, O(n) reads).
        return Flux.fromIterable(sessions)
                .concatMap(s -> {
                    if (s.getAvailabilityId() == null) {
                        return Mono.just(MentorshipSessionResponse.from(s));
                    }
                    return availabilityRepository.findById(s.getAvailabilityId())
                            .map(av -> MentorshipSessionResponse.from(s, av))
                            .defaultIfEmpty(MentorshipSessionResponse.from(s));
                })
                .collectList()
                .flatMap(this::attachUserDisplay);
    }

    private Mono<List<MentorshipSessionResponse>> attachUserDisplay(List<MentorshipSessionResponse> list) {
        Set<Integer> ids = new HashSet<>();
        for (MentorshipSessionResponse r : list) {
            if (r.getMentorMemberId() != null) ids.add(r.getMentorMemberId());
            if (r.getMenteeMemberId() != null) ids.add(r.getMenteeMemberId());
        }
        if (ids.isEmpty()) return Mono.just(list);

        return userDisplayInfoRepository.findByUserIds(ids)
                .map(map -> {
                    for (MentorshipSessionResponse r : list) {
                        UserDisplayInfo m = r.getMentorMemberId() != null ? map.get(r.getMentorMemberId()) : null;
                        if (m != null) {
                            r.setMentorName(m.getFullName());
                            r.setMentorAvatarUrl(m.getAvatarUrl());
                        }
                        UserDisplayInfo me = r.getMenteeMemberId() != null ? map.get(r.getMenteeMemberId()) : null;
                        if (me != null) {
                            r.setMenteeName(me.getFullName());
                            r.setMenteeAvatarUrl(me.getAvatarUrl());
                        }
                    }
                    return list;
                });
    }

    private Mono<List<MentorProfileResponse>> attachProfileDisplay(List<MentorProfileResponse> list) {
        if (list.isEmpty()) return Mono.just(list);
        Set<Integer> ids = new HashSet<>();
        for (MentorProfileResponse r : list) {
            if (r.getMemberId() != null) ids.add(r.getMemberId());
        }
        if (ids.isEmpty()) return Mono.just(list);

        Mono<Map<Integer, UserDisplayInfo>> displayMono = userDisplayInfoRepository.findByMemberIds(ids);
        Mono<Map<Integer, java.util.List<String>>> topicsMono = expertiseRepository
                .findByMentorMemberIds(ids)
                .collectMultimap(MentorExpertise::getMentorMemberId,
                        MentorExpertise::getTopic)
                .map(mm -> {
                    java.util.HashMap<Integer, java.util.List<String>> out = new java.util.HashMap<>();
                    mm.forEach((k, v) -> out.put(k, new java.util.ArrayList<>(v)));
                    return (Map<Integer, java.util.List<String>>) out;
                });

        return Mono.zip(displayMono, topicsMono).map(tuple -> {
            Map<Integer, UserDisplayInfo> dmap = tuple.getT1();
            Map<Integer, java.util.List<String>> tmap = tuple.getT2();
            for (MentorProfileResponse r : list) {
                UserDisplayInfo info = dmap.get(r.getMemberId());
                if (info != null) {
                    r.withDisplay(info.getFullName(), info.getAvatarUrl());
                }
                java.util.List<String> topics = tmap.get(r.getMemberId());
                if (topics != null) {
                    r.setExpertiseTopics(topics);
                }
            }
            return list;
        });
    }

    private Mono<MentorProfileResponse> attachProfileDisplay(MentorProfileResponse single) {
        return attachProfileDisplay(List.of(single)).map(l -> l.get(0));
    }


    // ===================== BROWSE MENTORS =====================

    public Mono<PaginatedResponse<MentorProfileResponse>> getApprovedMentors(int page, int limit) {
        int offset = page * limit;
        return profileRepository.findApprovedMentors(limit, offset)
                .collectList()
                .flatMap(entities -> attachProfileDisplay(entities.stream().map(MentorProfileResponse::from).toList())
                        .zipWith(profileRepository.countApprovedMentors())
                        .map(t -> PaginatedResponse.of(t.getT1(), t.getT2(), page, limit)));
    }

    public Mono<MentorProfileResponse> getMentorProfile(Integer mentorMemberId) {
        return profileRepository.findById(mentorMemberId)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.MENTOR_PROFILE_NOT_FOUND, "Mentor profile not found")))
                .map(MentorProfileResponse::from)
                .flatMap(this::attachProfileDisplay);
    }

    public Mono<PaginatedResponse<MentorProfileResponse>> searchMentors(String keyword, int page, int limit) {
        int offset = page * limit;
        return profileRepository.searchMentorsWithName(keyword, limit, offset)
                .collectList()
                .flatMap(entities -> attachProfileDisplay(entities.stream().map(MentorProfileResponse::from).toList())
                        .zipWith(profileRepository.countSearchMentorsWithName(keyword))
                        .map(t -> PaginatedResponse.of(t.getT1(), t.getT2(), page, limit)));
    }

    public Mono<PaginatedResponse<MentorProfileResponse>> filterMentors(
            String search, String category, String expertise, BigDecimal minRating, boolean hasAvailability,
            LocalDateTime availableFrom, LocalDateTime availableTo,
            int page, int limit) {
        int offset = page * limit;
        return profileRepository
                .filterMentors(search, category, expertise, minRating, hasAvailability, availableFrom, availableTo, limit, offset)
                .collectList()
                .flatMap(entities -> attachProfileDisplay(entities.stream().map(MentorProfileResponse::from).toList())
                        .zipWith(profileRepository.countFilterMentors(search, category, expertise, minRating, hasAvailability, availableFrom, availableTo))
                        .map(t -> PaginatedResponse.of(t.getT1(), t.getT2(), page, limit)));
    }

    public Mono<List<String>> getDistinctExpertiseTopics() {
        return expertiseRepository.findDistinctTopics().collectList();
    }

    public Mono<List<String>> getDistinctExpertiseCategories() {
        return expertiseRepository.findDistinctCategories().collectList();
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

    // ===================== MENTEE PROFILE =====================

    public Mono<MenteeProfileResponse> createOrUpdateMyMenteeProfile(CreateMenteeProfileRequest request) {
        return currentMemberId().flatMap(memberId ->
                menteeProfileRepository.findById(memberId)
                        .flatMap(existing -> {
                            existing.setMentoringGoal(request.getMentoringGoal());
                            existing.setMajor(request.getMajor());
                            existing.setAcademicYear(request.getAcademicYear());
                            existing.setInterests(request.getInterests());
                            existing.setIsActive(true);
                            existing.setUpdatedAt(LocalDateTime.now());
                            existing.setNew(false);
                            return menteeProfileRepository.save(existing);
                        })
                        .switchIfEmpty(Mono.defer(() -> menteeProfileRepository.save(MenteeProfile.builder()
                                .memberId(memberId)
                                .mentoringGoal(request.getMentoringGoal())
                                .major(request.getMajor())
                                .academicYear(request.getAcademicYear())
                                .interests(request.getInterests())
                                .isActive(true)
                                .createdAt(LocalDateTime.now())
                                .updatedAt(LocalDateTime.now())
                                .build())))
                        .map(MenteeProfileResponse::from));
    }

    public Mono<MenteeProfileResponse> getMyMenteeProfile() {
        return currentMemberId().flatMap(memberId ->
                menteeProfileRepository.findById(memberId)
                        .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.MENTEE_PROFILE_NOT_FOUND, "Mentee profile not found")))
                        .map(MenteeProfileResponse::from));
    }

    // ===================== BOOK SESSION =====================

    public Mono<MentorshipSessionResponse> bookSession(BookSessionRequest request) {
        return currentMemberId().flatMap(memberId ->
                menteeProfileRepository.findById(memberId)
                        .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.MENTEE_PROFILE_NOT_FOUND, "Bạn cần hoàn thiện hồ sơ Mentee trước khi đặt lịch")))
                        .flatMap(menteeProfile -> {
                            if (!Boolean.TRUE.equals(menteeProfile.getIsActive())) {
                                return Mono.error(new ApplicationException(ErrorCode.MENTEE_PROFILE_NOT_FOUND, "Hồ sơ Mentee chưa được kích hoạt"));
                            }
                            return availabilityRepository.findById(request.getAvailabilityId())
                                    .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.AVAILABILITY_NOT_FOUND, "Availability slot not found")))
                                    .flatMap(availability -> {
                                        if (Status.AVAILABLE != availability.getStatus()) {
                                            return Mono.error(new ApplicationException(ErrorCode.AVAILABILITY_NOT_AVAILABLE, "This time slot is no longer available"));
                                        }

                                        MentorshipSession session = MentorshipSession.builder()
                                                .availabilityId(request.getAvailabilityId())
                                                .menteeMemberId(memberId)
                                                .status(Status.PENDING)
                                                .bookingNote(request.getBookingNote())
                                                .sessionType(MentorshipSessionType.valueOf(request.getSessionType().toUpperCase()))
                                                .introduction(request.getIntroduction())
                                                .description(request.getDescription())
                                                .cvUrl(request.getCvUrl())
                                                .createdAt(LocalDateTime.now())
                                                .build();

                                        return availabilityRepository.updateStatus(availability.getId(), Status.BOOKED.getValue())
                                                .then(sessionRepository.save(session));
                                    });
                        })
                        .flatMap(this::enrich));
    }

    // ===================== MY SESSIONS (Mentee view) =====================

    public Mono<PaginatedResponse<MentorshipSessionResponse>> getMySessions(int page, int limit) {
        int offset = page * limit;
        return currentMemberId().flatMap(memberId ->
                sessionRepository.findByMenteeMemberId(memberId, limit, offset)
                        .collectList()
                        .flatMap(list -> enrichAll(list)
                                .zipWith(sessionRepository.countByMenteeMemberId(memberId))
                                .map(tuple -> PaginatedResponse.of(tuple.getT1(), tuple.getT2(), page, limit))
                        ));
    }

    public Mono<PaginatedResponse<MentorshipSessionResponse>> filterMySessions(
            LocalDate date, String mentorName, int page, int limit) {
        int offset = page * limit;
        return currentMemberId().flatMap(memberId ->
                sessionRepository.filterSessionsByMentee(memberId, date, mentorName, limit, offset)
                        .collectList()
                        .flatMap(list -> enrichAll(list)
                                .zipWith(sessionRepository.countFilterSessionsByMentee(memberId, date, mentorName))
                                .map(tuple -> PaginatedResponse.of(tuple.getT1(), tuple.getT2(), page, limit))
                        ));
    }

    public Mono<MentorshipSessionResponse> getSessionById(Integer sessionId) {
        return sessionRepository.findById(sessionId)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.SESSION_NOT_FOUND, "Session not found with id: " + sessionId)))
                .flatMap(this::enrich);
    }

    public Mono<MentorshipSessionResponse> cancelSession(Integer sessionId) {
        return sessionRepository.findById(sessionId)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.SESSION_NOT_FOUND, "Session not found with id: " + sessionId)))
                .flatMap(session -> {
                        if (Status.CANCELLED.equals(session.getStatus())) {
                        return Mono.error(new ApplicationException(ErrorCode.SESSION_ALREADY_CANCELLED, "Session is already cancelled"));
                    }
                        return availabilityRepository.updateStatus(session.getAvailabilityId(), Status.AVAILABLE.getValue())
                            .then(sessionRepository.updateStatus(sessionId, Status.CANCELLED.getValue()))
                            .then(sessionRepository.findById(sessionId));
                })
                .flatMap(this::enrich);
    }

    // ===================== FEEDBACK =====================

    public Mono<SessionFeedbackResponse> createFeedback(Integer sessionId, CreateFeedbackRequest request) {
        return currentMemberId().flatMap(memberId ->
                sessionRepository.findById(sessionId)
                        .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.SESSION_NOT_FOUND, "Session not found")))
                        .flatMap(session -> {
                            if (!Status.COMPLETED.equals(session.getStatus())) {
                                return Mono.error(new ApplicationException(ErrorCode.SESSION_NOT_COMPLETED, "Can only provide feedback for completed sessions"));
                            }
                            return feedbackRepository.existsBySessionId(sessionId)
                                    .flatMap(exists -> {
                                        if (Boolean.TRUE.equals(exists)) {
                                            return Mono.error(new ApplicationException(ErrorCode.FEEDBACK_ALREADY_EXISTS, "Feedback already exists for this session"));
                                        }

                                        SessionFeedback feedback = SessionFeedback.builder()
                                                .sessionId(sessionId)
                                                .menteeMemberId(memberId)
                                                .rating(request.getRating())
                                                .comment(request.getComment())
                                                .isPublic(request.getIsPublic() != null ? request.getIsPublic() : true)
                                                .createdAt(LocalDateTime.now())
                                                .build();

                                        return feedbackRepository.save(feedback);
                                    });
                        })
                        .map(SessionFeedbackResponse::from));
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
