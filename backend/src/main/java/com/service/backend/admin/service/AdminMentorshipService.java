package com.service.backend.admin.service;

import com.service.backend.admin.dao.AdminMentorshipRepository;
import com.service.backend.admin.dao.AdminUserRepository;
import com.service.backend.admin.dto.AdminMentorProfileDTO;
import com.service.backend.admin.dto.AdminMentorshipSessionDTO;
import com.service.backend.admin.dto.MentorshipStatisticsDTO;
import com.service.backend.shared.entity.User;
import com.service.backend.mentorship.dao.MentorAvailabilityR2dbcRepository;
import com.service.backend.mentorship.dao.MentorProfileR2dbcRepository;
import com.service.backend.mentorship.dao.MentorshipSessionR2dbcRepository;
import com.service.backend.shared.entity.MentorAvailability;
import com.service.backend.shared.entity.MentorProfile;
import com.service.backend.shared.enums.Status;
import com.service.backend.shared.entity.MentorshipSession;
import com.service.backend.shared.enums.ErrorCode;
import com.service.backend.shared.dto.PaginatedResponse;
import com.service.backend.shared.exception.ApplicationException;
import com.service.backend.shared.service.EmailService;
import com.service.backend.shared.utils.JsonUtils;
import com.service.backend.shared.utils.PaginationHelper;
import com.service.backend.shared.utils.SecurityUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.HashMap;
import java.util.Map;
import java.util.Set;
import java.util.HashSet;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
public class AdminMentorshipService {

    private static final Logger log = LoggerFactory.getLogger(AdminMentorshipService.class);

    private final AdminMentorshipRepository adminMentorshipRepository;
    private final MentorshipSessionR2dbcRepository sessionRepo;
    private final MentorProfileR2dbcRepository mentorProfileRepo;
    private final MentorAvailabilityR2dbcRepository availabilityRepo;
    private final AdminUserRepository adminUserRepository;
    private final EmailService emailService;

    public AdminMentorshipService(AdminMentorshipRepository adminMentorshipRepository,
                                  MentorshipSessionR2dbcRepository sessionRepo,
                                  MentorProfileR2dbcRepository mentorProfileRepo,
                                  MentorAvailabilityR2dbcRepository availabilityRepo,
                                  AdminUserRepository adminUserRepository,
                                  EmailService emailService) {
        this.adminMentorshipRepository = adminMentorshipRepository;
        this.sessionRepo = sessionRepo;
        this.mentorProfileRepo = mentorProfileRepo;
        this.availabilityRepo = availabilityRepo;
        this.adminUserRepository = adminUserRepository;
        this.emailService = emailService;
    }

    public Mono<PaginatedResponse<AdminMentorshipSessionDTO>> getAllSessions(Integer organizationId, int page, int size) {
        int offset = page * size;
        if (organizationId != null) {
            return PaginationHelper.paginate(
                        enrichSessions(adminMentorshipRepository.findSessionsByOrganization(organizationId, size, offset)),
                        adminMentorshipRepository.countSessionsByOrganization(organizationId),
                        page, size)
                    .doOnSuccess(r -> log.info("getAllSessions (org={}) result: {}", organizationId, JsonUtils.toJson(r)));
        }
        return PaginationHelper.paginate(
                    enrichSessions(adminMentorshipRepository.findAllSessions(size, offset)),
                    adminMentorshipRepository.countAllSessions(),
                    page, size)
                .doOnSuccess(r -> log.info("getAllSessions result: {}", JsonUtils.toJson(r)));
    }

    public Mono<PaginatedResponse<AdminMentorshipSessionDTO>> getSessionsByStatus(Integer organizationId, String status, int page, int size) {
        int offset = page * size;
        String upperStatus = status == null ? null : status.toUpperCase();
        if (organizationId != null) {
            return PaginationHelper.paginate(
                        enrichSessions(adminMentorshipRepository.findSessionsByOrganizationAndStatus(organizationId, upperStatus, size, offset)),
                        adminMentorshipRepository.countSessionsByOrganizationAndStatus(organizationId, upperStatus),
                        page, size)
                    .doOnSuccess(r -> log.info("getSessionsByStatus (org={}) result: {}", organizationId, JsonUtils.toJson(r)));
        }
        return PaginationHelper.paginate(
                    enrichSessions(adminMentorshipRepository.findSessionsByStatus(upperStatus, size, offset)),
                    adminMentorshipRepository.countSessionsByStatus(upperStatus),
                    page, size)
                .doOnSuccess(r -> log.info("getSessionsByStatus result: {}", JsonUtils.toJson(r)));
    }

    public Mono<AdminMentorshipSessionDTO> getSessionById(Integer sessionId) {
        return adminMentorshipRepository.findById(sessionId)
                .switchIfEmpty(Mono.defer(() -> Mono.error(new ApplicationException(ErrorCode.SESSION_NOT_FOUND))))
                .flatMap(this::enrichSession)
                .doOnSuccess(r -> log.info("getSessionById result: {}", JsonUtils.toJson(r)));
    }

    public Mono<AdminMentorshipSessionDTO> updateSessionStatus(Integer sessionId, String status) {
        String upperStatus = status == null ? null : status.toUpperCase();
        return adminMentorshipRepository.findById(sessionId)
                .switchIfEmpty(Mono.defer(() -> Mono.error(new ApplicationException(ErrorCode.SESSION_NOT_FOUND))))
            .flatMap(s -> sessionRepo.updateStatus(sessionId, upperStatus).then(adminMentorshipRepository.findById(sessionId)))
                .flatMap(this::enrichSession)
                .doOnSuccess(r -> log.info("updateSessionStatus result: {}", JsonUtils.toJson(r)));
    }

    public Mono<Void> deleteSession(Integer sessionId) {
        return adminMentorshipRepository.findById(sessionId)
                .switchIfEmpty(Mono.defer(() -> Mono.error(new ApplicationException(ErrorCode.SESSION_NOT_FOUND))))
                .flatMap(s -> sessionRepo.deleteById(sessionId))
                .doOnSuccess(v -> log.info("deleteSession: sessionId={} deleted", sessionId));
    }

    public Mono<PaginatedResponse<AdminMentorProfileDTO>> getAllMentorProfiles(Integer organizationId, int page, int size) {
        int offset = page * size;
        if (organizationId != null) {
            return PaginationHelper.paginate(
                        enrichMentors(adminMentorshipRepository.findMentorProfilesByOrganization(organizationId, size, offset)),
                        adminMentorshipRepository.countMentorProfilesByOrganization(organizationId),
                        page, size)
                    .doOnSuccess(r -> log.info("getAllMentorProfiles (org={}) result: {}", organizationId, JsonUtils.toJson(r)));
        }
        return PaginationHelper.paginate(
                    enrichMentors(adminMentorshipRepository.findAllMentorProfiles(size, offset)),
                    adminMentorshipRepository.countAllMentorProfiles(),
                    page, size)
                .doOnSuccess(r -> log.info("getAllMentorProfiles result: {}", JsonUtils.toJson(r)));
    }

    public Mono<PaginatedResponse<AdminMentorProfileDTO>> getMentorProfilesByStatus(Integer organizationId, String status, int page, int size) {
        int offset = page * size;
        String upperStatus = status == null ? null : status.toUpperCase();
        if (organizationId != null) {
            return PaginationHelper.paginate(
                        enrichMentors(adminMentorshipRepository.findMentorProfilesByOrganizationAndStatus(organizationId, upperStatus, size, offset)),
                        adminMentorshipRepository.countMentorProfilesByOrganizationAndStatus(organizationId, upperStatus),
                        page, size)
                    .doOnSuccess(r -> log.info("getMentorProfilesByStatus (org={}) result: {}", organizationId, JsonUtils.toJson(r)));
        }
        return PaginationHelper.paginate(
                    enrichMentors(adminMentorshipRepository.findMentorProfilesByStatus(upperStatus, size, offset)),
                    adminMentorshipRepository.countMentorProfilesByStatus(upperStatus),
                    page, size)
                .doOnSuccess(r -> log.info("getMentorProfilesByStatus result: {}", JsonUtils.toJson(r)));
    }

    public Mono<AdminMentorProfileDTO> approveMentor(Integer memberId) {
        return applyReview(memberId, Status.APPROVED, null);
    }

    public Mono<AdminMentorProfileDTO> rejectMentor(Integer memberId, String reason) {
        return applyReview(memberId, Status.REJECTED, reason);
    }

    public Mono<AdminMentorProfileDTO> requestMentorUpdate(Integer memberId, String reason) {
        return applyReview(memberId, Status.NEED_UPDATE, reason);
    }

    private Mono<AdminMentorProfileDTO> applyReview(Integer memberId, Status targetStatus, String reason) {
        return SecurityUtils.getCurrentUserId()
                .map(Long::intValue)
                .defaultIfEmpty(0)
                .flatMap(reviewerId ->
                        adminMentorshipRepository.findMentorProfileById(memberId)
                                .switchIfEmpty(Mono.defer(() -> Mono.error(new ApplicationException(ErrorCode.MENTOR_PROFILE_NOT_FOUND))))
                                .flatMap(p -> {
                                    Mono<Integer> writeMono;
                                    if (Status.APPROVED.equals(targetStatus)) {
                                        writeMono = mentorProfileRepo.approveMentorByReviewer(memberId, reviewerId);
                                    } else {
                                        writeMono = mentorProfileRepo.applyReview(memberId, targetStatus.getValue(), reason, reviewerId);
                                    }
                                    return writeMono
                                            .then(adminMentorshipRepository.findMentorProfileById(memberId))
                                            .flatMap(updated -> sendReviewEmail(updated, targetStatus, reason).thenReturn(updated));
                                })
                                .flatMap(this::enrichMentor)
                                .doOnSuccess(r -> log.info("applyReview {} result: {}", targetStatus, JsonUtils.toJson(r))));
    }

    private Mono<Void> sendReviewEmail(MentorProfile profile, Status status, String reason) {
        if (profile.getMemberId() == null) return Mono.empty();
        return adminUserRepository.findById(profile.getMemberId())
                .flatMap(user -> {
                    if (user.getEmail() == null || user.getEmail().isBlank()) return Mono.empty();
                    Map<String, Object> vars = new HashMap<>();
                    vars.put("recipientName", user.getEmail() != null ? user.getEmail() : "bạn");
                    vars.put("status", status.getValue());
                    vars.put("statusLabel", statusLabel(status));
                    vars.put("reason", reason != null ? reason : "");
                    String subject = "[AlumVerse] Cập nhật hồ sơ Mentor: " + statusLabel(status);
                    return emailService.sendHtmlEmail(user.getEmail(), subject, "mentorApplicationReview", vars)
                            .onErrorResume(e -> {
                                log.warn("Failed to send mentor review email to {}: {}", user.getEmail(), e.getMessage());
                                return Mono.empty();
                            });
                });
    }

    private String statusLabel(Status status) {
        if (status == null) return "";
        return switch (status) {
            case APPROVED -> "Đã duyệt";
            case REJECTED -> "Bị từ chối";
            case NEED_UPDATE -> "Cần cập nhật";
            case PENDING -> "Đang chờ duyệt";
            case DRAFT -> "Bản nháp";
            default -> status.getValue();
        };
    }

    public Mono<MentorshipStatisticsDTO> getStatistics() {
        return Mono.zip(
                        adminMentorshipRepository.countAllSessions().defaultIfEmpty(0L),
                        adminMentorshipRepository.countSessionsByStatus(Status.PENDING.getValue()).defaultIfEmpty(0L),
                        adminMentorshipRepository.countSessionsByStatus(Status.CONFIRMED.getValue()).defaultIfEmpty(0L),
                        adminMentorshipRepository.countSessionsByStatus(Status.COMPLETED.getValue()).defaultIfEmpty(0L),
                        adminMentorshipRepository.countSessionsByStatus(Status.CANCELLED.getValue()).defaultIfEmpty(0L),
                        adminMentorshipRepository.countSessionsByStatus(Status.REJECTED.getValue()).defaultIfEmpty(0L),
                        adminMentorshipRepository.countAllMentorProfiles().defaultIfEmpty(0L),
                        adminMentorshipRepository.countApprovedMentors().defaultIfEmpty(0L))
                .flatMap(t -> Mono.zip(
                                adminMentorshipRepository.countPendingMentors().defaultIfEmpty(0L),
                                adminMentorshipRepository.countAllAvailabilities().defaultIfEmpty(0L),
                                adminMentorshipRepository.countAllFeedbacks().defaultIfEmpty(0L))
                        .map(t2 -> MentorshipStatisticsDTO.builder()
                                .totalSessions(t.getT1())
                                .pendingSessions(t.getT2())
                                .confirmedSessions(t.getT3())
                                .completedSessions(t.getT4())
                                .cancelledSessions(t.getT5())
                                .rejectedSessions(t.getT6())
                                .totalMentors(t.getT7())
                                .approvedMentors(t.getT8())
                                .pendingMentors(t2.getT1())
                                .totalAvailabilities(t2.getT2())
                                .totalFeedbacks(t2.getT3())
                                .build()))
                .doOnSuccess(r -> log.info("getStatistics result: {}", JsonUtils.toJson(r)));
    }

    private Mono<AdminMentorshipSessionDTO> enrichSession(MentorshipSession s) {
        return enrichSessions(Flux.just(s)).next();
    }

    private Flux<AdminMentorshipSessionDTO> enrichSessions(Flux<MentorshipSession> sessionsFlux) {
        return sessionsFlux.collectList().flatMapMany(sessions -> {
            if (sessions.isEmpty()) return Flux.empty();
            Set<Integer> availIds = sessions.stream()
                    .map(MentorshipSession::getAvailabilityId)
                    .filter(Objects::nonNull)
                    .collect(Collectors.toSet());
            return availabilityRepo.findAllById(availIds).collectMap(MentorAvailability::getId).flatMapMany(availMap -> {
                Set<Integer> userIds = new HashSet<>();
                for (MentorshipSession s : sessions) {
                    if (s.getMenteeMemberId() != null) userIds.add(s.getMenteeMemberId());
                    MentorAvailability avail = availMap.get(s.getAvailabilityId());
                    if (avail != null && avail.getMentorMemberId() != null) userIds.add(avail.getMentorMemberId());
                }
                if (userIds.isEmpty()) {
                    return Flux.fromIterable(sessions).map(s -> buildSessionDTO(s, availMap.get(s.getAvailabilityId()), null, null));
                }
                return adminUserRepository.findAllById(userIds).collectMap(User::getId).flatMapMany(userMap -> Flux.fromIterable(sessions).map(s -> {
                    MentorAvailability avail = availMap.get(s.getAvailabilityId());
                    User mentee = userMap.get(s.getMenteeMemberId());
                    User mentor = avail != null ? userMap.get(avail.getMentorMemberId()) : null;
                    return buildSessionDTO(s, avail, mentee, mentor);
                }));
            });
        });
    }

    private AdminMentorshipSessionDTO buildSessionDTO(MentorshipSession s, MentorAvailability avail, User mentee, User mentor) {
        return AdminMentorshipSessionDTO.builder()
                .id(s.getId())
                .availabilityId(s.getAvailabilityId())
                .menteeMemberId(s.getMenteeMemberId())
                .menteeName(mentee != null ? mentee.getEmail() : null)
                .menteeEmail(mentee != null ? mentee.getEmail() : null)
                .mentorMemberId(avail != null ? avail.getMentorMemberId() : null)
                .mentorName(mentor != null ? mentor.getEmail() : null)
                .mentorEmail(mentor != null ? mentor.getEmail() : null)
                .status(s.getStatus() != null ? s.getStatus().getValue() : null)
                .sessionType(s.getSessionType() != null ? s.getSessionType().getValue() : null)
                .bookingNote(s.getBookingNote())
                .introduction(s.getIntroduction())
                .description(s.getDescription())
                .meetingLink(s.getMeetingLink())
                .cvUrl(s.getCvUrl())
                .startTime(avail != null ? avail.getStartTime() : null)
                .endTime(avail != null ? avail.getEndTime() : null)
                .createdAt(s.getCreatedAt())
                .build();
    }

    private Mono<AdminMentorProfileDTO> enrichMentor(MentorProfile p) {
        return enrichMentors(Flux.just(p)).next();
    }

    private Flux<AdminMentorProfileDTO> enrichMentors(Flux<MentorProfile> profilesFlux) {
        return profilesFlux.collectList().flatMapMany(profiles -> {
            if (profiles.isEmpty()) return Flux.empty();
            Set<Integer> userIds = profiles.stream()
                    .map(MentorProfile::getMemberId)
                    .filter(Objects::nonNull)
                    .collect(Collectors.toSet());
            if (userIds.isEmpty()) {
                return Flux.fromIterable(profiles).map(p -> buildProfileDTO(p, null));
            }
            return adminUserRepository.findAllById(userIds).collectMap(User::getId).flatMapMany(userMap -> Flux.fromIterable(profiles).map(p -> buildProfileDTO(p, userMap.get(p.getMemberId()))));
        });
    }

    private AdminMentorProfileDTO buildProfileDTO(MentorProfile p, User u) {
        return AdminMentorProfileDTO.builder()
                .memberId(p.getMemberId())
                .mentorName(u != null ? u.getEmail() : null)
                .mentorEmail(u != null ? u.getEmail() : null)
                .currentJobTitle(p.getCurrentJobTitle())
                .currentCompany(p.getCurrentCompany())

                .ratingAvg(p.getRatingAvg())
                .totalSessions(p.getTotalSessions())
                .status(p.getStatus() != null ? p.getStatus().getValue() : null)
                .reviewNote(p.getReviewNote())
                .reviewedAt(p.getReviewedAt())
                .createdAt(p.getCreatedAt())
                .updatedAt(p.getUpdatedAt())
                .build();
    }
}
