package com.service.backend.mentorship.service;

import com.service.backend.mentorship.dao.*;
import com.service.backend.mentorship.dto.*;
import com.service.backend.shared.entity.MentorAvailability;
import com.service.backend.shared.entity.MentorExpertise;
import com.service.backend.shared.entity.MentorProfile;
import com.service.backend.shared.entity.MentorProfileStatus;
import com.service.backend.shared.entity.MentorshipSession;
import com.service.backend.shared.dao.UserDisplayInfo;
import com.service.backend.shared.dao.UserDisplayInfoRepository;
import org.springframework.r2dbc.core.DatabaseClient;
import com.service.backend.shared.dto.PaginatedResponse;
import com.service.backend.shared.enums.ErrorCode;
import com.service.backend.shared.exception.ApplicationException;
import com.service.backend.shared.utils.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

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

    private Mono<MentorProfileResponse> attachProfileDisplay(MentorProfileResponse single) {
        if (single.getMemberId() == null) return Mono.just(single);
        return userDisplayInfoRepository.findByUserId(single.getMemberId())
                .map(info -> single.withDisplay(info.getFullName(), info.getAvatarUrl()))
                .defaultIfEmpty(single);
    }

    // ===================== PROFILE =====================

    public Mono<MentorProfileResponse> createProfile(CreateMentorProfileRequest request) {
        return saveProfile(request, MentorProfileStatus.PENDING);
    }

    public Mono<MentorProfileResponse> saveDraft(CreateMentorProfileRequest request) {
        return saveProfile(request, MentorProfileStatus.DRAFT);
    }

    private Mono<MentorProfileResponse> saveProfile(CreateMentorProfileRequest request, String targetStatus) {
        return currentMemberId().flatMap(memberId ->
                profileRepository.findById(memberId)
                        .flatMap(existing -> {
                            String current = existing.getStatus();
                            if (MentorProfileStatus.APPROVED.equals(current)
                                    || MentorProfileStatus.PENDING.equals(current)) {
                                return Mono.<MentorProfile>error(new ApplicationException(
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
                            if (MentorProfileStatus.PENDING.equals(targetStatus)) {
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
                                return Mono.<Boolean>error(new ApplicationException(ErrorCode.EXPERTISE_NOT_FOUND, "Expertise not found"));
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
                                return Mono.<MentorExpertise>error(new ApplicationException(ErrorCode.EXPERTISE_NOT_FOUND, "Expertise not found"));
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
        return currentMemberId().flatMap(memberId ->
                validateSlot(memberId, request.getStartTime(), request.getEndTime(), null)
                        .then(Mono.defer(() -> {
                            MentorAvailability availability = MentorAvailability.builder()
                                    .mentorMemberId(memberId)
                                    .startTime(request.getStartTime())
                                    .endTime(request.getEndTime())
                                    .status("Available")
                                    .build();
                            return availabilityRepository.save(availability)
                                    .map(MentorAvailabilityResponse::from);
                        })));
    }

    public Mono<MentorAvailabilityResponse> updateAvailability(Integer availabilityId,
                                                               CreateAvailabilityRequest request) {
        return currentMemberId().flatMap(memberId ->
                availabilityRepository.findById(availabilityId)
                        .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.AVAILABILITY_NOT_FOUND, "Availability not found")))
                        .flatMap(existing -> {
                            if (!memberId.equals(existing.getMentorMemberId())) {
                                return Mono.<MentorAvailability>error(new ApplicationException(ErrorCode.AVAILABILITY_NOT_FOUND, "Availability not found"));
                            }
                            if (!"Available".equals(existing.getStatus())) {
                                return Mono.<MentorAvailability>error(new ApplicationException(ErrorCode.AVAILABILITY_NOT_AVAILABLE, "Slot đã được đặt, không thể chỉnh sửa"));
                            }
                            return validateSlot(memberId, request.getStartTime(), request.getEndTime(), availabilityId)
                                    .then(Mono.defer(() -> {
                                        existing.setStartTime(request.getStartTime());
                                        existing.setEndTime(request.getEndTime());
                                        return availabilityRepository.save(existing);
                                    }));
                        })
                        .map(MentorAvailabilityResponse::from));
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
        return currentMemberId().flatMap(memberId ->
                availabilityRepository.findById(availabilityId)
                        .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.AVAILABILITY_NOT_FOUND, "Availability not found with id: " + availabilityId)))
                        .flatMap(existing -> {
                            if (!memberId.equals(existing.getMentorMemberId())) {
                                return Mono.<Boolean>error(new ApplicationException(ErrorCode.AVAILABILITY_NOT_FOUND, "Availability not found"));
                            }
                            if (!"Available".equals(existing.getStatus())) {
                                return Mono.<Boolean>error(new ApplicationException(ErrorCode.AVAILABILITY_NOT_AVAILABLE, "Slot đã được đặt, không thể xoá"));
                            }
                            return availabilityRepository.deleteById(availabilityId).thenReturn(true);
                        }));
    }

    // ===================== SESSIONS (Mentor view) =====================

    public Mono<PaginatedResponse<MentorshipSessionResponse>> getMySessions(int page, int limit) {
        int offset = page * limit;
        return currentMemberId().flatMap(memberId ->
                sessionRepository.findByMentorMemberId(memberId, limit, offset)
                        .collectList()
                        .flatMap(list -> enrichAll(list)
                                .zipWith(sessionRepository.countByMentorMemberId(memberId))
                                .map(tuple -> PaginatedResponse.of(tuple.getT1(), tuple.getT2(), page, limit))
                        ));
    }

    public Mono<PaginatedResponse<MentorshipSessionResponse>> filterMySessions(
            LocalDate date, String menteeName, int page, int limit) {
        int offset = page * limit;
        return currentMemberId().flatMap(memberId ->
                sessionRepository.filterSessionsByMentor(memberId, date, menteeName, limit, offset)
                        .collectList()
                        .flatMap(list -> enrichAll(list)
                                .zipWith(sessionRepository.countFilterSessionsByMentor(memberId, date, menteeName))
                                .map(tuple -> PaginatedResponse.of(tuple.getT1(), tuple.getT2(), page, limit))
                        ));
    }

    public Mono<MentorshipSessionResponse> updateSessionStatus(Integer sessionId, UpdateSessionStatusRequest request) {
        return sessionRepository.findById(sessionId)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.SESSION_NOT_FOUND, "Session not found with id: " + sessionId)))
                .flatMap(session -> {
                    Mono<Integer> updateStatus = sessionRepository.updateStatus(sessionId, request.getStatus());
                    Mono<Integer> updateLink = request.getMeetingLink() != null
                            ? sessionRepository.updateMeetingLink(sessionId, request.getMeetingLink())
                            : Mono.just(0);

                    return updateStatus.then(updateLink)
                            .then(sessionRepository.findById(sessionId));
                })
                .flatMap(this::enrich);
    }

    // ===================== FEEDBACKS (Mentor view) =====================

    public Mono<PaginatedResponse<SessionFeedbackResponse>> getMyFeedbacks(int page, int limit) {
        return currentMemberId().flatMap(memberId ->
                feedbackRepository.findPublicFeedbacksByMentorId(memberId, limit, page * limit)
                        .collectList()
                        .zipWith(feedbackRepository.countPublicFeedbacksByMentorId(memberId))
                        .map(tuple -> PaginatedResponse.of(
                                tuple.getT1().stream().map(SessionFeedbackResponse::from).toList(),
                                tuple.getT2(), page, limit
                        )));
    }
}
