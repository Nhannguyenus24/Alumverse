package com.service.backend.mentorship.service;

import org.springframework.transaction.annotation.Transactional;
import com.service.backend.mentorship.dao.*;
import com.service.backend.mentorship.dto.*;
import com.service.backend.shared.entity.MentorAvailability;
import com.service.backend.shared.enums.Status;
import com.service.backend.shared.entity.MentorExpertise;
import com.service.backend.shared.entity.MentorProfile;
import com.service.backend.shared.entity.MentorshipSession;
import com.service.backend.shared.dao.UserDisplayInfo;
import com.service.backend.shared.dao.UserDisplayInfoRepository;
import org.springframework.r2dbc.core.DatabaseClient;
import com.service.backend.shared.dto.PaginatedResponse;
import com.service.backend.shared.utils.PaginationHelper;
import com.service.backend.shared.enums.ErrorCode;
import com.service.backend.shared.exception.ApplicationException;
import com.service.backend.shared.utils.SecurityUtils;
import com.service.backend.user.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MentorService {

    private final MentorProfileR2dbcRepository profileRepository;
    private final MentorExpertiseR2dbcRepository expertiseRepository;
    private final MentorAvailabilityR2dbcRepository availabilityRepository;
    private final MentorshipSessionR2dbcRepository sessionRepository;
    private final SessionFeedbackR2dbcRepository feedbackRepository;
    private final UserDisplayInfoRepository userDisplayInfoRepository;
    private final DatabaseClient databaseClient;
    private final MentorshipAccessService accessService;
    private final NotificationService notificationService;

    private Mono<Void> updateUserAvatar(Integer userId, String avatarUrl) {
        if (userId == null || avatarUrl == null || avatarUrl.isBlank()) return Mono.empty();
        return databaseClient
                .sql("UPDATE users SET avatar_url = :url WHERE id = :id")
                .bind("url", avatarUrl)
                .bind("id", userId)
                .fetch()
                .rowsUpdated()
                .then();
    }

    private Mono<Integer> currentMemberId() {
        return SecurityUtils.getCurrentUserId().map(Long::intValue);
    }

    private Mono<MentorshipSessionResponse> enrich(MentorshipSession session) {
        return enrichAll(List.of(session)).map(list -> list.get(0));
    }

    private Mono<List<MentorshipSessionResponse>> enrichAll(List<MentorshipSession> sessions) {
        if (sessions.isEmpty()) return Mono.just(List.of());

        // Batch-load all referenced availabilities in a single query instead of one findById per session.
        Set<Integer> availabilityIds = sessions.stream()
                .map(MentorshipSession::getAvailabilityId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        Mono<Map<Integer, MentorAvailability>> availabilitiesMono = availabilityIds.isEmpty()
                ? Mono.just(Map.of())
                : availabilityRepository.findAllById(availabilityIds).collectMap(MentorAvailability::getId);

        return availabilitiesMono.flatMap(availMap -> {
            List<MentorshipSessionResponse> list = new ArrayList<>(sessions.size());
            for (MentorshipSession s : sessions) {
                MentorAvailability av = s.getAvailabilityId() != null ? availMap.get(s.getAvailabilityId()) : null;
                list.add(av != null
                        ? MentorshipSessionResponse.from(s, av)
                        : MentorshipSessionResponse.from(s));
            }
            return attachUserDisplay(list);
        });
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

    private Mono<MentorProfileResponse> attachProfileDisplay(MentorProfileResponse single) {
        if (single.getMemberId() == null) return Mono.just(single);
        return userDisplayInfoRepository.findByUserId(single.getMemberId())
                .map(info -> single.withDisplay(info.getFullName(), info.getAvatarUrl()))
                .defaultIfEmpty(single);
    }

    // ===================== PROFILE =====================

    public Mono<MentorProfileResponse> createProfile(CreateMentorProfileRequest request) {
        return accessService.requireOrgVerifiedForMentorship()
                .then(saveProfile(request, Status.PENDING));
    }

    public Mono<MentorProfileResponse> saveDraft(CreateMentorProfileRequest request) {
        return accessService.requireOrgVerifiedForMentorship()
                .then(saveProfile(request, Status.DRAFT));
    }

    private Mono<MentorProfileResponse> saveProfile(CreateMentorProfileRequest request, Status targetStatus) {
        return currentMemberId().flatMap(memberId ->
                profileRepository.findById(memberId)
                        .flatMap(existing -> {
                                Status current = existing.getStatus();
                                if (Status.APPROVED.equals(current)
                                    || Status.PENDING.equals(current)) {
                                return Mono.error(new ApplicationException(
                                        ErrorCode.MENTOR_PROFILE_ALREADY_EXISTS,
                                        "Mentor profile already exists"));
                            }
                            if (request.getCurrentJobTitle() != null) existing.setCurrentJobTitle(request.getCurrentJobTitle());
                            if (request.getCurrentCompany() != null) existing.setCurrentCompany(request.getCurrentCompany());
                            if (request.getBio() != null) existing.setBio(request.getBio());
                            if (request.getCoverUrl() != null) existing.setCoverUrl(request.getCoverUrl());
                            if (request.getDefaultMeetingLink() != null) existing.setDefaultMeetingLink(request.getDefaultMeetingLink());
                            if (request.getBookingWindowSettings() != null) existing.setBookingWindowSettings(request.getBookingWindowSettings());
                            if (request.getExtendedProfile() != null) existing.setExtendedProfile(request.getExtendedProfile());
                            existing.setStatus(targetStatus);
                            if (Status.PENDING.equals(targetStatus)) {
                                existing.setReviewNote(null);
                                existing.setReviewedAt(null);
                                existing.setReviewedBy(null);
                            }
                            existing.setUpdatedAt(LocalDateTime.now());
                            existing.setNew(false);
                            return updateUserAvatar(memberId, request.getAvatarUrl())
                                    .then(profileRepository.save(existing));
                        })
                        .switchIfEmpty(Mono.defer(() -> {
                            MentorProfile profile = MentorProfile.builder()
                                    .memberId(memberId)
                                    .currentJobTitle(request.getCurrentJobTitle())
                                    .currentCompany(request.getCurrentCompany())
                                    .bio(request.getBio())
                                    .ratingAvg(java.math.BigDecimal.ZERO)
                                    .totalSessions(0)
                                    .status(targetStatus)
                                    .coverUrl(request.getCoverUrl())
                                    .defaultMeetingLink(request.getDefaultMeetingLink())
                                    .bookingWindowSettings(request.getBookingWindowSettings())
                                    .extendedProfile(request.getExtendedProfile())
                                    .createdAt(LocalDateTime.now())
                                    .updatedAt(LocalDateTime.now())
                                    .build();
                            return updateUserAvatar(memberId, request.getAvatarUrl())
                                    .then(profileRepository.save(profile));
                        }))
                        .map(MentorProfileResponse::from)
                        .flatMap(this::attachProfileDisplay));
    }

    public Mono<MentorProfileResponse> updateProfile(UpdateMentorProfileRequest request) {
        return currentMemberId().flatMap(memberId ->
                profileRepository.findById(memberId)
                        .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.MENTOR_PROFILE_NOT_FOUND, "Mentor profile not found")))
                        .flatMap(existing -> {
                            if (request.getCurrentJobTitle() != null) existing.setCurrentJobTitle(request.getCurrentJobTitle());
                            if (request.getCurrentCompany() != null) existing.setCurrentCompany(request.getCurrentCompany());
                            if (request.getBio() != null) existing.setBio(request.getBio());
                            if (request.getCoverUrl() != null) existing.setCoverUrl(request.getCoverUrl());
                            if (request.getDefaultMeetingLink() != null) existing.setDefaultMeetingLink(request.getDefaultMeetingLink());
                            if (request.getBookingWindowSettings() != null) existing.setBookingWindowSettings(request.getBookingWindowSettings());
                            if (request.getExtendedProfile() != null) existing.setExtendedProfile(request.getExtendedProfile());
                            existing.setNew(false);
                            return updateUserAvatar(memberId, request.getAvatarUrl())
                                    .then(profileRepository.save(existing));
                        })
                        .map(MentorProfileResponse::from)
                        .flatMap(this::attachProfileDisplay));
    }

    public Mono<MentorProfileResponse> getMyProfile() {
        return currentMemberId().flatMap(memberId ->
                profileRepository.findById(memberId)
                        .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.MENTOR_PROFILE_NOT_FOUND, "Mentor profile not found")))
                        .map(MentorProfileResponse::from)
                        .flatMap(this::attachProfileDisplay));
    }

    // ===================== EXPERTISE =====================

    public Mono<MentorExpertiseResponse> addExpertise(CreateExpertiseRequest request) {
        return currentMemberId().flatMap(memberId -> {
            MentorExpertise expertise = MentorExpertise.builder()
                    .mentorMemberId(memberId)
                    .topic(request.getTopic())
                    .yearsExperience(request.getYearsExperience())
                    .description(request.getDescription())
                    .category(request.getCategory())
                    .tag(request.getTag())
                    .build();

            return expertiseRepository.save(expertise)
                    .map(MentorExpertiseResponse::from);
        });
    }

    public Mono<java.util.List<MentorExpertiseResponse>> getMyExpertise() {
        return currentMemberId().flatMap(memberId ->
                expertiseRepository.findByMentorMemberId(memberId)
                        .map(MentorExpertiseResponse::from)
                        .collectList());
    }

    public Mono<Boolean> deleteExpertise(Integer expertiseId) {
        return currentMemberId().flatMap(memberId ->
                expertiseRepository.findById(expertiseId)
                        .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.EXPERTISE_NOT_FOUND, "Expertise not found with id: " + expertiseId)))
                        .flatMap(existing -> {
                            if (!memberId.equals(existing.getMentorMemberId())) {
                                return Mono.error(new ApplicationException(ErrorCode.EXPERTISE_NOT_FOUND, "Expertise not found"));
                            }
                            return expertiseRepository.deleteById(expertiseId).thenReturn(true);
                        }));
    }

    public Mono<MentorExpertiseResponse> updateExpertise(Integer expertiseId, UpdateExpertiseRequest request) {
        return currentMemberId().flatMap(memberId ->
                expertiseRepository.findById(expertiseId)
                        .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.EXPERTISE_NOT_FOUND, "Expertise not found with id: " + expertiseId)))
                        .flatMap(existing -> {
                            if (!memberId.equals(existing.getMentorMemberId())) {
                                return Mono.error(new ApplicationException(ErrorCode.EXPERTISE_NOT_FOUND, "Expertise not found"));
                            }
                            if (request.getTopic() != null) existing.setTopic(request.getTopic());
                            if (request.getYearsExperience() != null) existing.setYearsExperience(request.getYearsExperience());
                            if (request.getDescription() != null) existing.setDescription(request.getDescription());
                            if (request.getCategory() != null) existing.setCategory(request.getCategory());
                            if (request.getTag() != null) existing.setTag(request.getTag());
                            return expertiseRepository.save(existing);
                        })
                        .map(MentorExpertiseResponse::from));
    }

    // ===================== AVAILABILITY =====================

    public Mono<MentorAvailabilityResponse> addAvailability(CreateAvailabilityRequest request) {
        return accessService.requireCurrentUserApprovedMentor()
                .then(currentMemberId().flatMap(memberId ->
                        validateSlot(memberId, request.getStartTime(), request.getEndTime(), null)
                                .then(Mono.defer(() -> {
                                    MentorAvailability availability = MentorAvailability.builder()
                                            .mentorMemberId(memberId)
                                            .startTime(request.getStartTime())
                                            .endTime(request.getEndTime())
                                            .status(Status.AVAILABLE)
                                            .build();
                                    return availabilityRepository.save(availability)
                                            .map(MentorAvailabilityResponse::from);
                                }))));
    }

    public Mono<MentorAvailabilityResponse> updateAvailability(Integer availabilityId,
                                                               CreateAvailabilityRequest request) {
        return accessService.requireCurrentUserApprovedMentor()
                .then(currentMemberId().flatMap(memberId ->
                availabilityRepository.findById(availabilityId)
                        .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.AVAILABILITY_NOT_FOUND, "Availability not found")))
                        .flatMap(existing -> {
                            if (!memberId.equals(existing.getMentorMemberId())) {
                                return Mono.error(new ApplicationException(ErrorCode.AVAILABILITY_NOT_FOUND, "Availability not found"));
                            }
                            if (Status.AVAILABLE != existing.getStatus()) {
                                return Mono.error(new ApplicationException(ErrorCode.AVAILABILITY_NOT_AVAILABLE, "Slot đã được đặt, không thể chỉnh sửa"));
                            }
                            return validateSlot(memberId, request.getStartTime(), request.getEndTime(), availabilityId)
                                    .then(Mono.defer(() -> {
                                        existing.setStartTime(request.getStartTime());
                                        existing.setEndTime(request.getEndTime());
                                        return availabilityRepository.save(existing);
                                    }));
                        })
                        .map(MentorAvailabilityResponse::from)));
    }

    private Mono<Void> validateSlot(Integer memberId, LocalDateTime startTime, LocalDateTime endTime, Integer excludeId) {
        if (startTime == null || endTime == null) {
            return Mono.error(new ApplicationException(ErrorCode.AVAILABILITY_INVALID_RANGE, "Slot phải có giờ bắt đầu và kết thúc"));
        }
        if (!endTime.isAfter(startTime)) {
            return Mono.error(new ApplicationException(ErrorCode.AVAILABILITY_INVALID_RANGE, "Giờ kết thúc phải sau giờ bắt đầu"));
        }
        if (!startTime.isAfter(LocalDateTime.now())) {
            return Mono.error(new ApplicationException(ErrorCode.AVAILABILITY_IN_PAST, "Slot phải nằm trong tương lai"));
        }
        return availabilityRepository.countOverlapping(memberId, startTime, endTime, excludeId)
                .flatMap(count -> count > 0
                        ? Mono.error(new ApplicationException(ErrorCode.AVAILABILITY_OVERLAP, "Slot trùng với một slot đã tồn tại"))
                        : Mono.empty());
    }

    public Mono<java.util.List<MentorAvailabilityResponse>> getMyAvailabilities() {
        return currentMemberId().flatMap(memberId ->
                availabilityRepository.findByMentorMemberId(memberId)
                        .map(MentorAvailabilityResponse::from)
                        .collectList());
    }

    public Mono<Boolean> deleteAvailability(Integer availabilityId) {
        return accessService.requireCurrentUserApprovedMentor()
                .then(currentMemberId().flatMap(memberId ->
                availabilityRepository.findById(availabilityId)
                        .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.AVAILABILITY_NOT_FOUND, "Availability not found with id: " + availabilityId)))
                        .flatMap(existing -> {
                            if (!memberId.equals(existing.getMentorMemberId())) {
                                return Mono.error(new ApplicationException(ErrorCode.AVAILABILITY_NOT_FOUND, "Availability not found"));
                            }
                            if (Status.AVAILABLE != existing.getStatus()) {
                                return Mono.error(new ApplicationException(ErrorCode.AVAILABILITY_NOT_AVAILABLE, "Slot đã được đặt, không thể xoá"));
                            }
                            return availabilityRepository.deleteById(availabilityId).thenReturn(true);
                        })));
    }

    // ===================== SESSIONS (Mentor view) =====================

    public Mono<PaginatedResponse<MentorshipSessionResponse>> getMySessions(int page, int limit) {
        int offset = page * limit;
        return currentMemberId().flatMap(memberId ->
                PaginationHelper.paginate(
                        sessionRepository.findByMentorMemberId(memberId, limit, offset),
                        sessionRepository.countByMentorMemberId(memberId),
                        page,
                        limit,
                        this::enrichAll));
    }

    public Mono<PaginatedResponse<MentorshipSessionResponse>> filterMySessions(
            LocalDate date, String menteeName, int page, int limit) {
        int offset = page * limit;
        return currentMemberId().flatMap(memberId ->
                PaginationHelper.paginate(
                        sessionRepository.filterSessionsByMentor(memberId, date, menteeName, limit, offset),
                        sessionRepository.countFilterSessionsByMentor(memberId, date, menteeName),
                        page,
                        limit,
                        this::enrichAll));
    }

    @Transactional
    public Mono<MentorshipSessionResponse> cancelSession(Integer sessionId, String cancelReason) {
        return currentMemberId().flatMap(mentorMemberId ->
                sessionRepository.findById(sessionId)
                        .switchIfEmpty(Mono.error(new ApplicationException(
                                ErrorCode.SESSION_NOT_FOUND, "Session not found with id: " + sessionId)))
                        .flatMap(session -> {
                            if (Status.CANCELLED.equals(session.getStatus())
                                    || Status.CANCELLED_BY_MENTEE.equals(session.getStatus())
                                    || Status.CANCELLED_BY_MENTOR.equals(session.getStatus())) {
                                return Mono.error(new ApplicationException(
                                        ErrorCode.SESSION_ALREADY_CANCELLED, "Buổi mentoring đã được hủy trước đó"));
                            }
                            return availabilityRepository.findById(session.getAvailabilityId())
                                    .flatMap(avail -> {
                                        if (!mentorMemberId.equals(avail.getMentorMemberId())) {
                                            return Mono.error(new ApplicationException(
                                                    ErrorCode.FORBIDDEN, "Bạn không có quyền hủy buổi mentoring này"));
                                        }
                                        boolean slotPast = avail.getEndTime() == null
                                                || avail.getEndTime().isBefore(LocalDateTime.now());
                                        String slotStatus = (slotPast ? Status.EXPIRED : Status.AVAILABLE).getValue();
                                        return availabilityRepository
                                                .updateStatus(session.getAvailabilityId(), slotStatus)
                                                .then(sessionRepository.updateStatusWithCancelReason(
                                                        sessionId, Status.CANCELLED_BY_MENTOR.getValue(), cancelReason))
                                                .doOnNext(rows -> notificationService.createNotificationAsync(
                                                        session.getMenteeMemberId(),
                                                        "Lịch hẹn bị hủy",
                                                        "Cố vấn đã hủy một buổi hẹn với bạn. Bạn có thể chọn một cố vấn hoặc khung giờ khác phù hợp hơn.",
                                                        "/development/mentorship/my-bookings"))
                                                .then(sessionRepository.findById(sessionId));
                                    });
                        })
                        .flatMap(this::enrich));
    }

    @Transactional
    public Mono<MentorshipSessionResponse> postponeSession(Integer sessionId, PostponeSessionRequest request) {
        LocalDateTime proposedStart = request.getProposedStartTime();
        LocalDateTime proposedEnd = request.getProposedEndTime();
        if (proposedStart == null || proposedEnd == null) {
            return Mono.error(new ApplicationException(
                    ErrorCode.AVAILABILITY_INVALID_RANGE, "Cần đề xuất giờ bắt đầu và kết thúc mới"));
        }
        if (!proposedEnd.isAfter(proposedStart)) {
            return Mono.error(new ApplicationException(
                    ErrorCode.AVAILABILITY_INVALID_RANGE, "Giờ kết thúc phải sau giờ bắt đầu"));
        }
        if (!proposedStart.isAfter(LocalDateTime.now())) {
            return Mono.error(new ApplicationException(
                    ErrorCode.AVAILABILITY_IN_PAST, "Giờ đề xuất phải nằm trong tương lai"));
        }
        return currentMemberId().flatMap(mentorMemberId ->
                sessionRepository.findById(sessionId)
                        .switchIfEmpty(Mono.error(new ApplicationException(
                                ErrorCode.SESSION_NOT_FOUND, "Session not found with id: " + sessionId)))
                        .flatMap(session -> {
                            if (!Status.CONFIRMED.equals(session.getStatus())) {
                                return Mono.error(new ApplicationException(
                                        ErrorCode.SESSION_ALREADY_CANCELLED, "Buổi mentoring không thể dời lịch ở trạng thái hiện tại"));
                            }
                            return availabilityRepository.findById(session.getAvailabilityId())
                                    .flatMap(avail -> {
                                        if (!mentorMemberId.equals(avail.getMentorMemberId())) {
                                            return Mono.error(new ApplicationException(
                                                    ErrorCode.FORBIDDEN, "Bạn không có quyền dời buổi mentoring này"));
                                        }
                                        String note = (request.getReason() == null || request.getReason().isBlank())
                                                ? "Cố vấn đề nghị dời buổi hẹn"
                                                : "Cố vấn đề nghị dời buổi hẹn: " + request.getReason();
                                        // Validate the proposed time does not clash with the mentor's other
                                        // slots (excluding the current slot, which will be moved on accept).
                                        return availabilityRepository.countOverlapping(
                                                        mentorMemberId, proposedStart, proposedEnd, avail.getId())
                                                .flatMap(count -> count > 0
                                                        ? Mono.error(new ApplicationException(
                                                                ErrorCode.AVAILABILITY_OVERLAP,
                                                                "Giờ đề xuất trùng với một lịch trống khác của bạn"))
                                                        : sessionRepository.proposeReschedule(
                                                                sessionId, Status.RESCHEDULE_PROPOSED.getValue(),
                                                                note, proposedStart, proposedEnd))
                                                .doOnNext(rows -> notificationService.createNotificationAsync(
                                                        session.getMenteeMemberId(),
                                                        "Cố vấn đề nghị dời lịch hẹn",
                                                        "Cố vấn đề xuất một khung giờ mới cho buổi hẹn. Vui lòng xem và phản hồi đồng ý hoặc từ chối.",
                                                        "/development/mentorship/my-bookings"))
                                                .then(sessionRepository.findById(sessionId));
                                    });
                        })
                        .flatMap(this::enrich));
    }

    @Transactional
    public Mono<MentorshipSessionResponse> updateSessionStatus(Integer sessionId, UpdateSessionStatusRequest request) {
        return currentMemberId().flatMap(mentorMemberId ->
                sessionRepository.findById(sessionId)
                        .switchIfEmpty(Mono.error(new ApplicationException(
                                ErrorCode.SESSION_NOT_FOUND, "Session not found with id: " + sessionId)))
                        .flatMap(session -> {
                            Mono<Integer> updateStatus = sessionRepository.updateStatus(sessionId, request.getStatus());
                            Mono<Integer> updateLink = request.getMeetingLink() != null
                                    ? sessionRepository.updateMeetingLink(sessionId, request.getMeetingLink())
                                    : Mono.just(0);
                            return updateStatus.then(updateLink)
                                    .doOnNext(ignored -> {
                                        if ("COMPLETED".equals(request.getStatus())) {
                                            notificationService.createNotificationAsync(
                                                    session.getMenteeMemberId(),
                                                    "Buổi cố vấn đã hoàn tất",
                                                    "Buổi cố vấn của bạn đã hoàn thành. Hãy dành chút thời gian để lại đánh giá cho cố vấn nhé!",
                                                    "/development/mentorship/my-bookings");
                                        }
                                    })
                                    .then(sessionRepository.findById(sessionId));
                        })
                        .flatMap(this::enrich));
    }

    @Transactional
    public Mono<MentorshipSessionResponse> updateSessionMeetingLink(Integer sessionId, String meetingLink) {
        if (meetingLink == null || meetingLink.isBlank()) {
            return Mono.error(new ApplicationException(
                    ErrorCode.BAD_REQUEST, "Link tham gia không được để trống"));
        }
        return currentMemberId().flatMap(mentorMemberId ->
                sessionRepository.findById(sessionId)
                        .switchIfEmpty(Mono.error(new ApplicationException(
                                ErrorCode.SESSION_NOT_FOUND, "Session not found with id: " + sessionId)))
                        .flatMap(session -> availabilityRepository.findById(session.getAvailabilityId())
                                .flatMap(avail -> {
                                    if (!mentorMemberId.equals(avail.getMentorMemberId())) {
                                        return Mono.error(new ApplicationException(
                                                ErrorCode.FORBIDDEN, "Bạn không có quyền cập nhật buổi mentoring này"));
                                    }
                                    return sessionRepository.updateMeetingLink(sessionId, meetingLink.trim())
                                            .doOnNext(rows -> notificationService.createNotificationAsync(
                                                    session.getMenteeMemberId(),
                                                    "Đã có link tham gia buổi mentoring",
                                                    "Cố vấn đã thêm link tham gia cho buổi hẹn của bạn. Hãy kiểm tra chi tiết buổi hẹn.",
                                                    "/development/mentorship/my-bookings"))
                                            .then(sessionRepository.findById(sessionId));
                                }))
                        .flatMap(this::enrich));
    }

    // ===================== FEEDBACKS (Mentor view) =====================

    public Mono<PaginatedResponse<SessionFeedbackResponse>> getMyFeedbacks(int page, int limit) {
        return currentMemberId().flatMap(memberId ->
                PaginationHelper.paginate(
                        feedbackRepository.findPublicFeedbacksByMentorId(memberId, limit, page * limit).map(SessionFeedbackResponse::from),
                        feedbackRepository.countPublicFeedbacksByMentorId(memberId),
                        page, limit));
    }
}
