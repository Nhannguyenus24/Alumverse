package com.service.backend.mentorship.service;

import org.springframework.transaction.annotation.Transactional;
import com.service.backend.mentorship.dao.*;
import com.service.backend.mentorship.dto.*;
import com.service.backend.shared.entity.MentorshipReport;
import com.service.backend.shared.entity.MenteeProfile;
import com.service.backend.shared.entity.MentorshipSession;
import com.service.backend.shared.enums.MentorshipSessionType;
import com.service.backend.shared.enums.Status;
import com.service.backend.shared.entity.SessionFeedback;
import com.service.backend.shared.dao.UserDisplayInfo;
import com.service.backend.user.dao.UserProfileRepository;
import com.service.backend.shared.dto.PaginatedResponse;
import com.service.backend.shared.utils.PaginationHelper;
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
    private final UserProfileRepository userProfileRepository;
    private final MenteeProfileR2dbcRepository menteeProfileRepository;
    private final MentorshipAccessService accessService;
    private final NotificationService notificationService;
    private final MentorshipReportR2dbcRepository reportRepository;
    private final SkillService skillService;

    private Mono<Integer> currentMemberId() {
        return SecurityUtils.getCurrentUserId().map(Long::intValue);
    }

    private Mono<Void> requireJoinedMentorship() {
        return currentMemberId().flatMap(memberId ->
                menteeProfileRepository.findById(memberId)
                        .map(profile -> Boolean.TRUE.equals(profile.getIsActive()))
                        .defaultIfEmpty(false)
                        .zipWith(profileRepository.findById(memberId)
                                .map(profile -> Status.APPROVED.equals(profile.getStatus()))
                                .defaultIfEmpty(false))
                        .flatMap(tuple -> {
                            boolean hasMentee = tuple.getT1();
                            boolean hasApprovedMentor = tuple.getT2();
                            if (hasMentee || hasApprovedMentor) {
                                return Mono.empty();
                            }
                            return Mono.error(new ApplicationException(
                                    ErrorCode.FORBIDDEN,
                                    "Bạn cần đăng ký trở thành mentee hoặc được duyệt làm cố vấn trước khi đặt lịch hẹn."));
                        }));
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
                .flatMap(this::attachUserDisplay)
                .flatMap(this::attachFeedbackState);
    }

    private Mono<List<MentorshipSessionResponse>> attachUserDisplay(List<MentorshipSessionResponse> list) {
        Set<Integer> ids = new HashSet<>();
        for (MentorshipSessionResponse r : list) {
            if (r.getMentorMemberId() != null) ids.add(r.getMentorMemberId());
            if (r.getMenteeMemberId() != null) ids.add(r.getMenteeMemberId());
        }
        if (ids.isEmpty()) return Mono.just(list);

        return userProfileRepository.findByUserIds(ids)
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

    private Mono<List<MentorshipSessionResponse>> attachFeedbackState(List<MentorshipSessionResponse> list) {
        Set<Integer> sessionIds = new HashSet<>();
        for (MentorshipSessionResponse r : list) {
            if (r.getId() != null) sessionIds.add(r.getId());
        }
        if (sessionIds.isEmpty()) return Mono.just(list);

        return feedbackRepository.findBySessionIds(sessionIds)
                .collectMap(SessionFeedback::getSessionId)
                .map(map -> {
                    for (MentorshipSessionResponse r : list) {
                        SessionFeedback feedback = r.getId() != null ? map.get(r.getId()) : null;
                        r.setHasFeedback(feedback != null);
                        r.setFeedbackId(feedback != null ? feedback.getId() : null);
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

        Mono<Map<Integer, UserDisplayInfo>> displayMono = userProfileRepository.findByMemberIds(ids);
        Mono<Map<Integer, java.util.List<String>>> topicsMono = expertiseRepository
                .findByMentorMemberIds(ids)
                .collectMultimap(MentorExpertise::getMentorMemberId,
                        MentorExpertise::getTopic)
                .map(mm -> {
                    java.util.HashMap<Integer, java.util.List<String>> out = new java.util.HashMap<>();
                    mm.forEach((k, v) -> out.put(k, new java.util.ArrayList<>(v)));
                    return out;
                });
        Mono<Map<Integer, java.util.List<String>>> tagsMono = Flux.fromIterable(ids)
                .flatMap(memberId -> skillService.getMentorSkills(memberId)
                        .map(skills -> Map.entry(memberId, skills.stream()
                                .map(SkillResponse::getName)
                                .toList())))
                .collectMap(Map.Entry::getKey, Map.Entry::getValue);

        return Mono.zip(displayMono, topicsMono, tagsMono).map(tuple -> {
            Map<Integer, UserDisplayInfo> dmap = tuple.getT1();
            Map<Integer, java.util.List<String>> tmap = tuple.getT2();
            Map<Integer, java.util.List<String>> smap = tuple.getT3();
            for (MentorProfileResponse r : list) {
                UserDisplayInfo info = dmap.get(r.getMemberId());
                if (info != null) {
                    r.withDisplay(
                            info.getFullName(),
                            info.getAvatarUrl(),
                            info.getCoverUrl(),
                            info.getCurrentJobTitle(),
                            info.getCurrentCompany());
                }
                java.util.List<String> topics = tmap.get(r.getMemberId());
                if (topics != null) {
                    r.setExpertiseTopics(topics);
                }
                java.util.List<String> tags = smap.get(r.getMemberId());
                if (tags != null) {
                    r.setExpertiseTags(tags);
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
                .then(PaginationHelper.paginate(
                        profileRepository.findApprovedMentors(limit, offset).map(MentorProfileResponse::from).collectList(),
                        profileRepository.countApprovedMentors(),
                        page,
                        limit,
                        list -> attachProfileDisplay(list).flatMap(this::applyBrowseAccessView)));
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
                .then(PaginationHelper.paginate(
                        profileRepository.searchMentorsWithName(keyword, limit, offset).map(MentorProfileResponse::from).collectList(),
                        profileRepository.countSearchMentorsWithName(keyword),
                        page,
                        limit,
                        list -> attachProfileDisplay(list).flatMap(this::applyBrowseAccessView)));
    }

    public Mono<PaginatedResponse<MentorProfileResponse>> filterMentors(
            String search, List<Integer> skillIds, BigDecimal minRating, boolean hasAvailability,
            LocalDateTime availableFrom, LocalDateTime availableTo,
            int page, int limit) {
        int offset = page * limit;
        boolean hasSkillFilter = skillIds != null && !skillIds.isEmpty();
        List<Integer> safeSkillIds = hasSkillFilter ? skillIds : List.of(-1);
        return accessService.requireEmailVerifiedForMentorBrowse()
                .then(PaginationHelper.paginate(
                        profileRepository.filterMentors(search, hasSkillFilter, safeSkillIds, minRating, hasAvailability, availableFrom, availableTo, limit, offset).map(MentorProfileResponse::from).collectList(),
                        profileRepository.countFilterMentors(search, hasSkillFilter, safeSkillIds, minRating, hasAvailability, availableFrom, availableTo),
                        page,
                        limit,
                        list -> attachProfileDisplay(list).flatMap(this::applyBrowseAccessView)));
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

    @Transactional
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

    @Transactional
    public Mono<MentorshipSessionResponse> bookSession(BookSessionRequest request) {
        return accessService.requireOrgVerifiedForMentorship()
                .then(requireJoinedMentorship())
                .then(currentMemberId().flatMap(memberId ->
                        availabilityRepository.findById(request.getAvailabilityId())
                                .switchIfEmpty(Mono.error(new ApplicationException(
                                        ErrorCode.AVAILABILITY_NOT_FOUND, "Lịch trống không tồn tại")))
                                .flatMap(availability -> {
                                    if (memberId.equals(availability.getMentorMemberId())) {
                                        return Mono.error(new ApplicationException(
                                                ErrorCode.SESSION_SELF_BOOKING_NOT_ALLOWED,
                                                "Bạn không thể đặt lịch với chính mình"));
                                    }
                                    if (Status.AVAILABLE != availability.getStatus()) {
                                        return Mono.error(new ApplicationException(
                                                ErrorCode.AVAILABILITY_NOT_AVAILABLE,
                                                "Lịch trống này đã có người đặt. Vui lòng chọn khung giờ khác"));
                                    }
                                    if (availability.getStartTime() == null
                                            || !availability.getStartTime().isAfter(LocalDateTime.now())) {
                                        return Mono.error(new ApplicationException(
                                                ErrorCode.AVAILABILITY_IN_PAST,
                                                "Khung giờ này đã qua. Vui lòng chọn khung giờ khác"));
                                    }
                                    return accessService
                                            .requireApprovedMentorProfile(availability.getMentorMemberId())
                                            .flatMap(mentorProfile -> {
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
                                                String defaultLink = mentorProfile.getDefaultMeetingLink();
                                                boolean hasDefaultLink = defaultLink != null && !defaultLink.isBlank();
                                                String message = hasDefaultLink
                                                        ? "Bạn vừa nhận được một lịch hẹn cố vấn mới. Hãy xem chi tiết và chuẩn bị cho buổi trao đổi."
                                                        : "Bạn vừa nhận được một lịch hẹn cố vấn mới, nhưng buổi này chưa có link tham gia. Hãy thêm link họp cho buổi trao đổi.";
                                        return availabilityRepository.updateStatus(availability.getId(), Status.BOOKED.getValue())
                                                .then(sessionRepository.save(session))
                                                .doOnSuccess(ignored ->
                                                        notificationService.createNotificationAsync(
                                                                availability.getMentorMemberId(),
                                                                "Lịch hẹn mới",
                                                                message,
                                                                "/mentorship/my-bookings"));
                                            });
                                })
                                .flatMap(this::enrich)));
    }


    public Mono<PaginatedResponse<MentorshipSessionResponse>> getMySessions(int page, int limit) {
        int offset = page * limit;
        return currentMemberId().flatMap(memberId ->
                PaginationHelper.paginate(
                        sessionRepository.findByMenteeMemberId(memberId, limit, offset).collectList(),
                        sessionRepository.countByMenteeMemberId(memberId),
                        page,
                        limit,
                        this::enrichAll));
    }

    public Mono<PaginatedResponse<MentorshipSessionResponse>> filterMySessions(
            LocalDate date, String mentorName, int page, int limit) {
        int offset = page * limit;
        return currentMemberId().flatMap(memberId ->
                PaginationHelper.paginate(
                        sessionRepository.filterSessionsByMentee(memberId, date, mentorName, limit, offset).collectList(),
                        sessionRepository.countFilterSessionsByMentee(memberId, date, mentorName),
                        page,
                        limit,
                        this::enrichAll));
    }

    public Mono<MentorshipSessionResponse> getSessionById(Integer sessionId) {
        return sessionRepository.findById(sessionId)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.SESSION_NOT_FOUND, "Session not found with id: " + sessionId)))
                .flatMap(this::enrich);
    }

    @Transactional
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
                            return availabilityRepository.findById(session.getAvailabilityId())
                                    .flatMap(avail -> Mono.when(
                                            availabilityRepository.updateStatus(session.getAvailabilityId(), reopenStatusFor(avail)),
                                            sessionRepository.updateStatusWithCancelReason(sessionId, Status.CANCELLED_BY_MENTEE.getValue(), cancelReason)
                                    ).doOnSuccess(ignored -> notificationService.createNotificationAsync(
                                            avail.getMentorMemberId(),
                                            "Lịch hẹn bị hủy",
                                            "Người được cố vấn đã hủy một buổi hẹn với bạn. Khung giờ tương ứng đã được mở lại.",
                                            "/mentorship/dashboard")))
                                    .then(sessionRepository.findById(sessionId));
                        })
                        .flatMap(this::enrich));
    }

    @Transactional
    public Mono<MentorshipSessionResponse> respondToReschedule(Integer sessionId, boolean accept) {
        return currentMemberId().flatMap(memberId ->
                sessionRepository.findById(sessionId)
                        .switchIfEmpty(Mono.error(new ApplicationException(
                                ErrorCode.SESSION_NOT_FOUND, "Session not found with id: " + sessionId)))
                        .flatMap(session -> {
                            if (!Status.RESCHEDULE_PROPOSED.equals(session.getStatus())) {
                                return Mono.error(new ApplicationException(
                                        ErrorCode.SESSION_ALREADY_CANCELLED,
                                        "Buổi mentoring này không có đề nghị dời lịch đang chờ"));
                            }
                            if (!memberId.equals(session.getMenteeMemberId())) {
                                return Mono.error(new ApplicationException(
                                        ErrorCode.FORBIDDEN, "Bạn không có quyền phản hồi buổi mentoring này"));
                            }
                            return availabilityRepository.findById(session.getAvailabilityId())
                                    .flatMap(avail -> accept
                                            ? acceptReschedule(session, avail)
                                            : rejectReschedule(session, avail))
                                    .then(sessionRepository.findById(sessionId));
                        })
                        .flatMap(this::enrich));
    }

    private Mono<?> acceptReschedule(MentorshipSession session, com.service.backend.shared.entity.MentorAvailability avail) {
        // Move the existing slot to the proposed time and reconfirm the session.
        return Mono.when(
                        availabilityRepository.updateTimes(avail.getId(), session.getProposedStartTime(), session.getProposedEndTime()),
                        sessionRepository.clearProposalWithStatus(session.getId(), Status.CONFIRMED.getValue())
                ).doOnSuccess(ignored -> notificationService.createNotificationAsync(
                        avail.getMentorMemberId(),
                        "Lịch hẹn đã được dời",
                        "Người được cố vấn đã đồng ý dời buổi hẹn sang khung giờ bạn đề xuất.",
                        "/mentorship/dashboard"));
    }

    private Mono<?> rejectReschedule(MentorshipSession session, com.service.backend.shared.entity.MentorAvailability avail) {
        return Mono.when(
                        availabilityRepository.updateStatus(avail.getId(), Status.AVAILABLE.getValue()),
                        sessionRepository.clearProposalWithStatus(session.getId(), Status.CANCELLED_BY_MENTEE.getValue())
                ).doOnSuccess(ignored -> notificationService.createNotificationAsync(
                        avail.getMentorMemberId(),
                        "Đề nghị dời lịch bị từ chối",
                        "Người được cố vấn đã từ chối đề nghị dời lịch và buổi hẹn đã bị hủy.",
                        "/mentorship/dashboard"));
    }

    private static boolean isCancelled(Status s) {
        return Status.CANCELLED.equals(s)
                || Status.CANCELLED_BY_MENTEE.equals(s)
                || Status.CANCELLED_BY_MENTOR.equals(s);
    }

    private static String reopenStatusFor(com.service.backend.shared.entity.MentorAvailability avail) {
        boolean past = avail.getEndTime() == null || avail.getEndTime().isBefore(LocalDateTime.now());
        return (past ? Status.EXPIRED : Status.AVAILABLE).getValue();
    }

    // ===================== FEEDBACK =====================

    @Transactional
    public Mono<SessionFeedbackResponse> createFeedback(Integer sessionId, CreateFeedbackRequest request) {
        return currentMemberId().flatMap(memberId ->
                sessionRepository.findById(sessionId)
                        .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.SESSION_NOT_FOUND, "Session not found")))
                        .flatMap(session -> {
                            if (!memberId.equals(session.getMenteeMemberId())) {
                                return Mono.error(new ApplicationException(
                                        ErrorCode.FORBIDDEN,
                                        "Bạn không có quyền đánh giá buổi mentoring này"));
                            }
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
                                                                                .flatMap(avg -> profileRepository.updateRating(
                                                                                        avail.getMentorMemberId(), avg))
                                                                                .doOnSuccess(ignored -> notificationService.createNotificationAsync(
                                                                                        avail.getMentorMemberId(),
                                                                                        "Bạn nhận được một đánh giá mới",
                                                                                        "Một buổi cố vấn vừa được đánh giá " + request.getRating() + "/5 sao. Xem chi tiết phản hồi của bạn.",
                                                                                        "/mentorship/dashboard")))
                                                                .thenReturn(savedFeedback));
                                    });
                        })
                        .map(SessionFeedbackResponse::from));
    }

    public Mono<PaginatedResponse<SessionFeedbackResponse>> getMentorFeedbacks(Integer mentorMemberId, int page, int limit) {
        return accessService.requireOrgVerifiedForMentorship()
                .then(accessService.requireApprovedMentorProfile(mentorMemberId)
                        .then(PaginationHelper.paginate(
                                feedbackRepository.findPublicFeedbacksByMentorId(mentorMemberId, limit, page * limit).map(SessionFeedbackResponse::from),
                                feedbackRepository.countPublicFeedbacksByMentorId(mentorMemberId),
                                page, limit)));
    }

    // ===================== REPORT =====================

    public Mono<Void> reportSession(Integer sessionId, CreateReportRequest request) {
        if (!com.service.backend.shared.enums.ReportReasonCategory.isValid(request.getReasonCategory())) {
            return Mono.error(new ApplicationException(ErrorCode.REPORT_REASON_REQUIRED));
        }
        boolean isOther = com.service.backend.shared.enums.ReportReasonCategory.OTHER.getValue()
                .equals(request.getReasonCategory());
        if (isOther && (request.getDescription() == null || request.getDescription().trim().length() < 10)) {
            return Mono.error(new ApplicationException(ErrorCode.REPORT_DESCRIPTION_REQUIRED));
        }
        return currentMemberId().flatMap(reporterMemberId ->
                sessionRepository.findById(sessionId)
                        .switchIfEmpty(Mono.error(new ApplicationException(
                                ErrorCode.SESSION_NOT_FOUND, "Không tìm thấy buổi mentoring")))
                        .flatMap(session -> {
                            if (!Status.COMPLETED.equals(session.getStatus())
                                    && !Status.EXPIRED.equals(session.getStatus())) {
                                return Mono.error(new ApplicationException(ErrorCode.REPORT_NOT_ALLOWED_STATUS));
                            }
                            boolean isMentee = reporterMemberId.equals(session.getMenteeMemberId());
                            return reportRepository
                                    .existsBySessionIdAndReporterMemberId(sessionId, reporterMemberId)
                                    .flatMap(exists -> {
                                        if (Boolean.TRUE.equals(exists)) {
                                            return Mono.error(new ApplicationException(ErrorCode.REPORT_ALREADY_EXISTS));
                                        }
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
                                                            .createdAt(LocalDateTime.now())
                                                            .build();
                                                    return reportRepository.save(report).then();
                                                });
                                    });
                        }));
    }
}
