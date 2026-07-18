package com.service.backend.admin.service;

import com.service.backend.admin.dao.AdminMentorshipRepository;
import com.service.backend.admin.dao.AdminUserRepository;
import com.service.backend.admin.dto.AdminMenteeDTO;
import com.service.backend.admin.dto.AdminMentorProfileDTO;
import com.service.backend.admin.dto.AdminMentorshipReportDTO;
import com.service.backend.admin.dto.AdminMentorshipSessionDTO;
import com.service.backend.admin.dto.MentorshipStatisticsDTO;
import com.service.backend.shared.entity.User;
import com.service.backend.mentorship.dao.MentorAvailabilityR2dbcRepository;
import com.service.backend.mentorship.dao.MentorProfileR2dbcRepository;
import com.service.backend.mentorship.dao.MentorshipReportR2dbcRepository;
import com.service.backend.mentorship.dao.MentorshipSessionR2dbcRepository;
import com.service.backend.shared.entity.MentorAvailability;
import com.service.backend.shared.entity.MentorProfile;
import com.service.backend.shared.entity.MentorshipReport;
import com.service.backend.shared.enums.Status;
import com.service.backend.shared.entity.MentorshipSession;
import com.service.backend.shared.enums.ErrorCode;
import com.service.backend.shared.dto.PaginatedResponse;
import com.service.backend.shared.exception.ApplicationException;
import com.service.backend.shared.service.EmailService;
import com.service.backend.shared.utils.JsonUtils;
import com.service.backend.shared.utils.PaginationHelper;
import com.service.backend.shared.utils.SecurityUtils;
import com.service.backend.user.service.NotificationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
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
    private final MentorshipReportR2dbcRepository reportRepo;
    private final AdminUserRepository adminUserRepository;
    private final EmailService emailService;
    private final NotificationService notificationService;

    public AdminMentorshipService(AdminMentorshipRepository adminMentorshipRepository,
                                  MentorshipSessionR2dbcRepository sessionRepo,
                                  MentorProfileR2dbcRepository mentorProfileRepo,
                                  MentorAvailabilityR2dbcRepository availabilityRepo,
                                  MentorshipReportR2dbcRepository reportRepo,
                                  AdminUserRepository adminUserRepository,
                                  EmailService emailService,
                                  NotificationService notificationService) {
        this.adminMentorshipRepository = adminMentorshipRepository;
        this.sessionRepo = sessionRepo;
        this.mentorProfileRepo = mentorProfileRepo;
        this.availabilityRepo = availabilityRepo;
        this.reportRepo = reportRepo;
        this.adminUserRepository = adminUserRepository;
        this.emailService = emailService;
        this.notificationService = notificationService;
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
                                            .flatMap(updated -> sendReviewEmail(updated, targetStatus, reason)
                                                    .then(Mono.fromRunnable(() -> sendReviewNotification(updated, targetStatus, reason)))
                                                    .thenReturn(updated));
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

    private void sendReviewNotification(MentorProfile profile, Status status, String reason) {
        if (profile.getMemberId() == null || status == null) return;
        String title;
        String message;
        String link = "/mentorship/profile";
        switch (status) {
            case APPROVED -> {
                title = "Hồ sơ cố vấn đã được duyệt";
                message = "Bạn đã trở thành mentor. Hãy kiểm tra hồ sơ và quản lý khung giờ tư vấn của mình.";
            }
            case REJECTED -> {
                title = "Hồ sơ cố vấn chưa được duyệt";
                message = reason != null && !reason.isBlank()
                        ? "Admin đã từ chối hồ sơ cố vấn của bạn: " + reason
                        : "Admin đã từ chối hồ sơ cố vấn của bạn. Bạn có thể gửi lại khi đã sẵn sàng.";
                link = "/mentorship/signup";
            }
            case NEED_UPDATE -> {
                title = "Hồ sơ cố vấn cần cập nhật";
                message = reason != null && !reason.isBlank()
                        ? "Admin yêu cầu cập nhật hồ sơ cố vấn: " + reason
                        : "Admin yêu cầu bạn cập nhật hồ sơ cố vấn trước khi duyệt.";
                link = "/mentorship/signup";
            }
            default -> {
                return;
            }
        }
        notificationService.createNotificationAsync(profile.getMemberId(), title, message, link);
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
                adminMentorshipRepository.getAggregatedMentorshipStats(),
                adminMentorshipRepository.getAggregatedMentorProfileStats(),
                adminMentorshipRepository.countAllAvailabilities().defaultIfEmpty(0L),
                adminMentorshipRepository.countAllFeedbacks().defaultIfEmpty(0L)
        ).map(tuple -> {
            var sessionStats = tuple.getT1();
            var profileStats = tuple.getT2();
            return MentorshipStatisticsDTO.builder()
                    .totalSessions(sessionStats.getTotalSessions() != null ? sessionStats.getTotalSessions() : 0L)
                    .pendingSessions(sessionStats.getPendingSessions() != null ? sessionStats.getPendingSessions() : 0L)
                    .confirmedSessions(sessionStats.getConfirmedSessions() != null ? sessionStats.getConfirmedSessions() : 0L)
                    .completedSessions(sessionStats.getCompletedSessions() != null ? sessionStats.getCompletedSessions() : 0L)
                    .cancelledSessions(sessionStats.getCancelledSessions() != null ? sessionStats.getCancelledSessions() : 0L)
                    .rejectedSessions(sessionStats.getRejectedSessions() != null ? sessionStats.getRejectedSessions() : 0L)
                    .totalMentors(profileStats.getTotalProfiles() != null ? profileStats.getTotalProfiles() : 0L)
                    .approvedMentors(profileStats.getApprovedProfiles() != null ? profileStats.getApprovedProfiles() : 0L)
                    .pendingMentors(profileStats.getPendingProfiles() != null ? profileStats.getPendingProfiles() : 0L)
                    .totalAvailabilities(tuple.getT3())
                    .totalFeedbacks(tuple.getT4())
                    .build();
        });
    }

    public Mono<PaginatedResponse<AdminMenteeDTO>> getMentees(Integer organizationId, int page, int size) {
        int offset = page * size;
        Flux<AdminMenteeDTO> rows = adminMentorshipRepository.findMentees(organizationId, size, offset)
                .map(p -> AdminMenteeDTO.builder()
                        .memberId(p.getMemberId())
                        .menteeName(StringUtils.hasText(p.getFullName()) ? p.getFullName() : p.getEmail())
                        .menteeEmail(p.getEmail())
                        .userStatus(p.getStatus())
                        .totalSessions(p.getTotalSessions() != null ? p.getTotalSessions() : 0L)
                        .completedSessions(p.getCompletedSessions() != null ? p.getCompletedSessions() : 0L)
                        .lastSessionAt(p.getLastSessionAt())
                        .build());
        return PaginationHelper.paginate(rows, adminMentorshipRepository.countMentees(organizationId), page, size)
                .doOnSuccess(r -> log.info("getMentees (org={}) result size: {}", organizationId,
                        r.getItems() != null ? r.getItems().size() : 0));
    }

    public Mono<PaginatedResponse<AdminMentorshipReportDTO>> getReports(String status, int page, int size) {
        int offset = page * size;
        String upper = StringUtils.hasText(status) ? status.toUpperCase() : null;
        Flux<MentorshipReport> reports = upper != null
                ? reportRepo.findReportsByStatus(upper, size, offset)
                : reportRepo.findAllReports(size, offset);
        Mono<Long> count = upper != null ? reportRepo.countReportsByStatus(upper) : reportRepo.countAllReports();
        return PaginationHelper.paginate(enrichReports(reports), count, page, size)
                .doOnSuccess(r -> log.info("getReports (status={}) result size: {}", upper,
                        r.getItems() != null ? r.getItems().size() : 0));
    }

    public Mono<AdminMentorshipReportDTO> resolveReport(Integer reportId, String action, String note) {
        String actionUpper = action == null ? "" : action.trim().toUpperCase();
        return SecurityUtils.getCurrentUserId().map(Long::intValue).defaultIfEmpty(0)
                .flatMap(resolverId -> reportRepo.findById(reportId)
                        .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.RESOURCES_NOT_FOUND,
                                "Không tìm thấy report")))
                        .flatMap(report -> {
                            if (!"PENDING".equalsIgnoreCase(report.getStatus())) {
                                return Mono.error(new ApplicationException(ErrorCode.BAD_REQUEST,
                                        "Report này đã được xử lý"));
                            }
                            String reportStatus = "DISMISS".equals(actionUpper) ? "DISMISSED" : "RESOLVED";
                            String actionTaken = normalizeAction(actionUpper);
                            return applySanction(report.getReportedMemberId(), actionTaken)
                                    .then(reportRepo.resolveReport(reportId, reportStatus, actionTaken, note, resolverId))
                                    .then(reportRepo.findById(reportId))
                                    .doOnNext(updated -> notifyReportOutcome(updated, actionTaken));
                        })
                        .flatMap(this::enrichReport)
                        .doOnSuccess(r -> log.info("resolveReport id={} action={} result: {}",
                                reportId, actionUpper, JsonUtils.toJson(r))));
    }

    private String normalizeAction(String actionUpper) {
        return switch (actionUpper) {
            case "SUSPENDED", "SUSPEND" -> "SUSPENDED";
            case "BANNED", "BAN" -> "BANNED";
            case "WARNING", "WARN" -> "WARNING";
            case "DISMISS" -> "NONE";
            default -> "NONE";
        };
    }

    private Mono<Void> applySanction(Integer reportedMemberId, String actionTaken) {
        if (reportedMemberId == null) return Mono.empty();
        return switch (actionTaken) {
            case "SUSPENDED" -> adminUserRepository.updateUserStatusById(reportedMemberId, Status.SUSPENDED.getValue()).then();
            case "BANNED" -> adminUserRepository.banUserById(reportedMemberId).then();
            default -> Mono.empty();
        };
    }

    private void notifyReportOutcome(MentorshipReport report, String actionTaken) {
        if (report.getReporterMemberId() != null) {
            notificationService.createNotificationAsync(report.getReporterMemberId(),
                    "Báo cáo của bạn đã được xử lý",
                    "Báo cáo về buổi mentoring của bạn đã được ban quản trị xem xét và xử lý. Cảm ơn bạn đã phản ánh.",
                    "/mentorship");
        }
        if (report.getReportedMemberId() != null) {
            String msg = switch (actionTaken) {
                case "SUSPENDED" -> "Tài khoản của bạn đã bị tạm khoá do vi phạm quy tắc mentoring. Vui lòng liên hệ ban quản trị để biết thêm chi tiết.";
                case "BANNED" -> "Tài khoản của bạn đã bị cấm do vi phạm nghiêm trọng quy tắc mentoring.";
                case "WARNING" -> "Bạn nhận được một cảnh báo liên quan tới buổi mentoring gần đây. Vui lòng tuân thủ quy tắc để tránh bị xử phạt.";
                default -> null;
            };
            if (msg != null) {
                notificationService.createNotificationAsync(report.getReportedMemberId(),
                        "Thông báo xử lý vi phạm", msg, "/mentorship");
            }
        }
    }

    private Mono<AdminMentorshipReportDTO> enrichReport(MentorshipReport r) {
        return enrichReports(Flux.just(r)).next();
    }

    private Flux<AdminMentorshipReportDTO> enrichReports(Flux<MentorshipReport> reportsFlux) {
        return reportsFlux.collectList().flatMapMany(reports -> {
            if (reports.isEmpty()) return Flux.empty();
            Set<Integer> userIds = new HashSet<>();
            for (MentorshipReport r : reports) {
                if (r.getReporterMemberId() != null) userIds.add(r.getReporterMemberId());
                if (r.getReportedMemberId() != null) userIds.add(r.getReportedMemberId());
            }
            if (userIds.isEmpty()) {
                return Flux.fromIterable(reports).map(r -> buildReportDTO(r, null, null));
            }
            return adminUserRepository.findAllById(userIds).collectMap(User::getId)
                    .flatMapMany(userMap -> Flux.fromIterable(reports)
                            .map(r -> buildReportDTO(r, userMap.get(r.getReporterMemberId()),
                                    userMap.get(r.getReportedMemberId()))));
        });
    }

    private AdminMentorshipReportDTO buildReportDTO(MentorshipReport r, User reporter, User reported) {
        return AdminMentorshipReportDTO.builder()
                .id(r.getId())
                .sessionId(r.getSessionId())
                .reporterMemberId(r.getReporterMemberId())
                .reporterName(displayName(reporter))
                .reporterEmail(reporter != null ? reporter.getEmail() : null)
                .reportedMemberId(r.getReportedMemberId())
                .reportedName(displayName(reported))
                .reportedEmail(reported != null ? reported.getEmail() : null)
                .reportedUserStatus(reported != null && reported.getStatus() != null
                        ? reported.getStatus().getValue() : null)
                .reasonCategory(r.getReasonCategory())
                .description(r.getDescription())
                .status(r.getStatus())
                .actionTaken(r.getActionTaken())
                .resolutionNote(r.getResolutionNote())
                .resolvedBy(r.getResolvedBy())
                .resolvedAt(r.getResolvedAt())
                .createdAt(r.getCreatedAt())
                .build();
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
                .menteeName(displayName(mentee))
                .menteeEmail(mentee != null ? mentee.getEmail() : null)
                .mentorMemberId(avail != null ? avail.getMentorMemberId() : null)
                .mentorName(displayName(mentor))
                .mentorEmail(mentor != null ? mentor.getEmail() : null)
                .status(s.getStatus() != null ? s.getStatus().getValue() : null)
                .sessionType(s.getSessionType() != null ? s.getSessionType().getValue() : null)
                .bookingNote(s.getBookingNote())
                .introduction(s.getIntroduction())
                .description(s.getDescription())
                .meetingLink(s.getMeetingLink())
                .cvUrl(s.getCvUrl())
                .cancelReason(s.getCancelReason())
                .startTime(avail != null ? avail.getStartTime() : null)
                .endTime(avail != null ? avail.getEndTime() : null)
                .mentorJoinedAt(s.getMentorJoinedAt())
                .menteeJoinedAt(s.getMenteeJoinedAt())
                .startedAt(s.getStartedAt())
                .endedAt(s.getEndedAt())
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

    /** Tên hiển thị ưu tiên full_name; rỗng thì fallback về email để không hiện null. */
    private String displayName(User u) {
        if (u == null) return null;
        if (u.getFullName() != null && !u.getFullName().isBlank()) return u.getFullName();
        return u.getEmail();
    }

    private AdminMentorProfileDTO buildProfileDTO(MentorProfile p, User u) {
        return AdminMentorProfileDTO.builder()
                .memberId(p.getMemberId())
                .mentorName(displayName(u))
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
