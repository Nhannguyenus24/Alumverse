package com.service.backend.mentorship.service;

import com.service.backend.mentorship.dao.*;
import com.service.backend.mentorship.dto.*;
import com.service.backend.shared.entity.MentorshipReport;
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
import com.service.backend.user.service.NotificationService;
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
    private final MentorshipAccessService accessService;
    private final NotificationService notificationService;
    private final MentorshipReportR2dbcRepository reportRepository;

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

    private Mono<List<MentorProfileResponse>> applyBrowseAccessView(List<MentorProfileResponse> profiles) {
        return accessService.isOrgVerifiedForMentorship()
                .map(fullAccess -> profiles.stream()
                        .map(p -> fullAccess ? p : p.asPreview())
                        .toList());
    }

    private Mono<MentorProfileResponse> applyBrowseAccessView(MentorProfileResponse profile) {
        return accessService.isOrgVerifiedForMentorship()
                .map(fullAccess -> fullAccess ? profile : profile.asPreview());
    }

    public Mono<PaginatedResponse<MentorProfileResponse>> getApprovedMentors(int page, int limit) {
        int offset = page * limit;
        return accessService.requireEmailVerifiedForMentorBrowse()
                .then(profileRepository.findApprovedMentors(limit, offset)
                        .collectList()
                        .flatMap(entities -> attachProfileDisplay(entities.stream().map(MentorProfileResponse::from).toList())
                                .flatMap(this::applyBrowseAccessView)
                                .zipWith(profileRepository.countApprovedMentors())
                                .map(t -> PaginatedResponse.of(t.getT1(), t.getT2(), page, limit))));
    }

    public Mono<MentorProfileResponse> getMentorProfile(Integer mentorMemberId) {
        return accessService.requireEmailVerifiedForMentorBrowse()
                .then(accessService.requireApprovedMentorProfile(mentorMemberId)
                        .map(MentorProfileResponse::from)
                        .flatMap(this::attachProfileDisplay)
                        .flatMap(this::applyBrowseAccessView));
    }

    public Mono<PaginatedResponse<MentorProfileResponse>> searchMentors(String keyword, int page, int limit) {
        int offset = page * limit;
        return accessService.requireEmailVerifiedForMentorBrowse()
                .then(profileRepository.searchMentorsWithName(keyword, limit, offset)
                        .collectList()
                        .flatMap(entities -> attachProfileDisplay(entities.stream().map(MentorProfileResponse::from).toList())
                                .flatMap(this::applyBrowseAccessView)
                                .zipWith(profileRepository.countSearchMentorsWithName(keyword))
                                .map(t -> PaginatedResponse.of(t.getT1(), t.getT2(), page, limit))));
    }

    public Mono<PaginatedResponse<MentorProfileResponse>> filterMentors(
            String search, String category, String expertise, BigDecimal minRating, boolean hasAvailability,
            LocalDateTime availableFrom, LocalDateTime availableTo,
            int page, int limit) {
        int offset = page * limit;
        return accessService.requireEmailVerifiedForMentorBrowse()
                .then(profileRepository
                        .filterMentors(search, category, expertise, minRating, hasAvailability, availableFrom, availableTo, limit, offset)
                        .collectList()
                        .flatMap(entities -> attachProfileDisplay(entities.stream().map(MentorProfileResponse::from).toList())
                                .flatMap(this::applyBrowseAccessView)
                                .zipWith(profileRepository.countFilterMentors(search, category, expertise, minRating, hasAvailability, availableFrom, availableTo))
                                .map(t -> PaginatedResponse.of(t.getT1(), t.getT2(), page, limit))));
    }

    public Mono<List<String>> getDistinctExpertiseTopics() {
        return accessService.requireEmailVerifiedForMentorBrowse()
                .then(expertiseRepository.findDistinctTopics().collectList());
    }

    public Mono<List<String>> getDistinctExpertiseCategories() {
        return accessService.requireEmailVerifiedForMentorBrowse()
                .then(expertiseRepository.findDistinctCategories().collectList());
    }

    public Mono<List<MentorExpertiseResponse>> getMentorExpertise(Integer mentorMemberId) {
        return accessService.requireEmailVerifiedForMentorBrowse()
                .then(accessService.requireApprovedMentorProfile(mentorMemberId)
                        .thenMany(expertiseRepository.findByMentorMemberId(mentorMemberId))
                        .map(MentorExpertiseResponse::from)
                        .collectList());
    }

    public Mono<List<MentorAvailabilityResponse>> getMentorAvailableSlots(Integer mentorMemberId) {
        return accessService.requireOrgVerifiedForMentorship()
                .then(accessService.requireApprovedMentorProfile(mentorMemberId)
                        .thenMany(availabilityRepository.findAvailableSlots(mentorMemberId, LocalDateTime.now()))
                        .map(MentorAvailabilityResponse::from)
                        .collectList());
    }

    // ===================== MENTEE PROFILE =====================

    public Mono<MenteeProfileResponse> createOrUpdateMyMenteeProfile(CreateMenteeProfileRequest request) {
        return accessService.requireOrgVerifiedForMentorship()
                .then(currentMemberId().flatMap(memberId ->
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
                        .map(MenteeProfileResponse::from)));
    }

    public Mono<MenteeProfileResponse> getMyMenteeProfile() {
        return currentMemberId().flatMap(memberId ->
                menteeProfileRepository.findById(memberId)
                        .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.MENTEE_PROFILE_NOT_FOUND, "Mentee profile not found")))
                        .map(MenteeProfileResponse::from));
    }

    // ===================== BOOK SESSION =====================

    public Mono<MentorshipSessionResponse> bookSession(BookSessionRequest request) {
        return accessService.requireOrgVerifiedForMentorship()
                .then(currentMemberId().flatMap(memberId ->
                        availabilityRepository.findById(request.getAvailabilityId())
                                .switchIfEmpty(Mono.error(new ApplicationException(
                                        ErrorCode.AVAILABILITY_NOT_FOUND, "Lịch trống không tồn tại")))
                                .flatMap(availability -> {
                                    // Block self-booking
                                    if (memberId.equals(availability.getMentorMemberId())) {
                                        return Mono.error(new ApplicationException(
                                                ErrorCode.SESSION_SELF_BOOKING_NOT_ALLOWED,
                                                "Bạn không thể đặt lịch với chính mình"));
                                    }
                                    // Slot must still be available
                                    if (Status.AVAILABLE != availability.getStatus()) {
                                        return Mono.error(new ApplicationException(
                                                ErrorCode.AVAILABILITY_NOT_AVAILABLE,
                                                "Lịch trống này đã có người đặt. Vui lòng chọn khung giờ khác"));
                                    }
                                    // Mentor must be APPROVED
                                    return accessService
                                            .requireApprovedMentorProfile(availability.getMentorMemberId())
                                            .then(Mono.defer(() -> {
                                                MentorshipSession session = MentorshipSession.builder()
                                                        .availabilityId(request.getAvailabilityId())
                                                        .menteeMemberId(memberId)
                                                        .status(Status.CONFIRMED)
                                                        .bookingNote(request.getBookingNote())
                                                        .sessionType(MentorshipSessionType.valueOf(
                                                                request.getSessionType().toUpperCase()))
                                                        .introduction(request.getIntroduction())
                                                        .description(request.getDescription())
                                                        .cvUrl(request.getCvUrl())
                                                        .createdAt(LocalDateTime.now())
                                                        .build();
                                        return availabilityRepository.updateStatus(
                                                        availability.getId(), Status.BOOKED.getValue())
                                                .then(sessionRepository.save(session))
                                                .doOnNext(saved ->
                                                        notificationService.createNotificationAsync(
                                                                availability.getMentorMemberId(),
                                                                "Lịch hẹn mới",
                                                                "Bạn vừa nhận được một lịch hẹn cố vấn mới. Hãy xem chi tiết và chuẩn bị cho buổi trao đổi.",
                                                                "/development/mentorship/dashboard"));
                                            }));
                                })
                                .flatMap(this::enrich)));
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

    public Mono<MentorshipSessionResponse> cancelSession(Integer sessionId, String cancelReason) {
        return currentMemberId().flatMap(memberId ->
                sessionRepository.findById(sessionId)
                        .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.SESSION_NOT_FOUND, "Session not found with id: " + sessionId)))
                        .flatMap(session -> {
                            if (isCancelled(session.getStatus())) {
                                return Mono.error(new ApplicationException(
                                        ErrorCode.SESSION_ALREADY_CANCELLED, "Buổi mentoring đã được hủy trước đó"));
                            }
                            if (!memberId.equals(session.getMenteeMemberId())) {
                                return Mono.error(new ApplicationException(
                                        ErrorCode.FORBIDDEN, "Bạn không có quyền hủy buổi mentoring này"));
                            }
                            return availabilityRepository.updateStatus(session.getAvailabilityId(), Status.AVAILABLE.getValue())
                                    .then(sessionRepository.updateStatusWithCancelReason(
                                            sessionId, Status.CANCELLED_BY_MENTEE.getValue(), cancelReason))
                                    .then(availabilityRepository.findById(session.getAvailabilityId()))
                                    .doOnNext(avail -> notificationService.createNotificationAsync(
                                            avail.getMentorMemberId(),
                                            "Lịch hẹn bị hủy",
                                            "Người được cố vấn đã hủy một buổi hẹn với bạn. Khung giờ tương ứng đã được mở lại.",
                                            "/development/mentorship/dashboard"))
                                    .then(sessionRepository.findById(sessionId));
                        })
                        .flatMap(this::enrich));
    }

    private static boolean isCancelled(Status s) {
        return Status.CANCELLED.equals(s)
                || Status.CANCELLED_BY_MENTEE.equals(s)
                || Status.CANCELLED_BY_MENTOR.equals(s);
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

                                        return feedbackRepository.save(feedback)
                                                .flatMap(savedFeedback ->
                                                        availabilityRepository.findById(session.getAvailabilityId())
                                                                .flatMap(avail ->
                                                                        feedbackRepository.calculateAverageRating(avail.getMentorMemberId())
                                                                                .defaultIfEmpty(BigDecimal.ZERO)
                                                                                .flatMap(avg -> profileRepository.updateRatingAndIncrementSessions(
                                                                                        avail.getMentorMemberId(), avg))
                                                                                .doOnSuccess(ignored -> notificationService.createNotificationAsync(
                                                                                        avail.getMentorMemberId(),
                                                                                        "Bạn nhận được một đánh giá mới",
                                                                                        "Một buổi cố vấn vừa được đánh giá " + request.getRating() + "/5 sao. Xem chi tiết phản hồi của bạn.",
                                                                                        "/development/mentorship/dashboard")))
                                                                .thenReturn(savedFeedback));
                                    });
                        })
                        .map(SessionFeedbackResponse::from));
    }

    public Mono<PaginatedResponse<SessionFeedbackResponse>> getMentorFeedbacks(Integer mentorMemberId, int page, int limit) {
        return accessService.requireOrgVerifiedForMentorship()
                .then(accessService.requireApprovedMentorProfile(mentorMemberId)
                        .then(feedbackRepository.findPublicFeedbacksByMentorId(mentorMemberId, limit, page * limit)
                                .collectList()
                                .zipWith(feedbackRepository.countPublicFeedbacksByMentorId(mentorMemberId))
                                .map(tuple -> PaginatedResponse.of(
                                        tuple.getT1().stream().map(SessionFeedbackResponse::from).toList(),
                                        tuple.getT2(), page, limit))));
    }

    // ===================== REPORT =====================

    public Mono<Void> reportSession(Integer sessionId, CreateReportRequest request) {
        return currentMemberId().flatMap(reporterMemberId ->
                sessionRepository.findById(sessionId)
                        .switchIfEmpty(Mono.error(new ApplicationException(
                                ErrorCode.SESSION_NOT_FOUND, "Không tìm thấy buổi mentoring")))
                        .flatMap(session -> {
                            boolean isMentee = reporterMemberId.equals(session.getMenteeMemberId());
                            return availabilityRepository.findById(session.getAvailabilityId())
                                    .flatMap(avail -> {
                                        Integer reportedMemberId = isMentee
                                                ? avail.getMentorMemberId()
                                                : session.getMenteeMemberId();
                                        MentorshipReport report = MentorshipReport.builder()
                                                .sessionId(sessionId)
                                                .reporterMemberId(reporterMemberId)
                                                .reportedMemberId(reportedMemberId)
                                                .reasonCategory(request.getReasonCategory())
                                                .description(request.getDescription())
                                                .status("PENDING")
                                                .createdAt(java.time.LocalDateTime.now())
                                                .build();
                                        return reportRepository.save(report).then();
                                    });
                        }));
    }
}
