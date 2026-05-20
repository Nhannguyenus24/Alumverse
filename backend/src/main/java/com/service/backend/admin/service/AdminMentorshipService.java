package com.service.backend.admin.service;

import com.service.backend.admin.dao.AdminMentorshipRepository;
import com.service.backend.admin.dao.AdminUserRepository;
import com.service.backend.admin.dto.AdminMentorProfileDTO;
import com.service.backend.admin.dto.AdminMentorshipSessionDTO;
import com.service.backend.admin.dto.MentorshipStatisticsDTO;
import com.service.backend.auth.entity.User;
import com.service.backend.mentorship.dao.MentorAvailabilityR2dbcRepository;
import com.service.backend.mentorship.dao.MentorProfileR2dbcRepository;
import com.service.backend.mentorship.dao.MentorshipSessionR2dbcRepository;
import com.service.backend.mentorship.entity.MentorAvailability;
import com.service.backend.mentorship.entity.MentorProfile;
import com.service.backend.mentorship.entity.MentorshipSession;
import com.service.backend.shared.constants.ErrorCode;
import com.service.backend.shared.dto.PaginatedResponse;
import com.service.backend.shared.exception.ApplicationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Service
public class AdminMentorshipService {

    private static final Logger log = LoggerFactory.getLogger(AdminMentorshipService.class);

    private static final String STATUS_PENDING = "Pending";
    private static final String STATUS_CONFIRMED = "Confirmed";
    private static final String STATUS_COMPLETED = "Completed";
    private static final String STATUS_CANCELLED = "Cancelled";
    private static final String STATUS_REJECTED = "Rejected";

    private final AdminMentorshipRepository adminMentorshipRepository;
    private final MentorshipSessionR2dbcRepository sessionRepo;
    private final MentorProfileR2dbcRepository mentorProfileRepo;
    private final MentorAvailabilityR2dbcRepository availabilityRepo;
    private final AdminUserRepository adminUserRepository;

    public AdminMentorshipService(AdminMentorshipRepository adminMentorshipRepository,
                                  MentorshipSessionR2dbcRepository sessionRepo,
                                  MentorProfileR2dbcRepository mentorProfileRepo,
                                  MentorAvailabilityR2dbcRepository availabilityRepo,
                                  AdminUserRepository adminUserRepository) {
        this.adminMentorshipRepository = adminMentorshipRepository;
        this.sessionRepo = sessionRepo;
        this.mentorProfileRepo = mentorProfileRepo;
        this.availabilityRepo = availabilityRepo;
        this.adminUserRepository = adminUserRepository;
    }

    public Mono<PaginatedResponse<AdminMentorshipSessionDTO>> getAllSessions(int page, int size) {
        log.info("Admin fetching all sessions - page {} size {}", page, size);
        int offset = page * size;
        return enrichSessions(adminMentorshipRepository.findAllSessions(size, offset))
                .collectList()
                .zipWith(adminMentorshipRepository.countAllSessions())
                .map(t -> PaginatedResponse.of(t.getT1(), t.getT2(), page, size));
    }

    public Mono<PaginatedResponse<AdminMentorshipSessionDTO>> getSessionsByStatus(String status, int page, int size) {
        log.info("Admin fetching sessions by status {} - page {} size {}", status, page, size);
        int offset = page * size;
        return enrichSessions(adminMentorshipRepository.findSessionsByStatus(status, size, offset))
                .collectList()
                .zipWith(adminMentorshipRepository.countSessionsByStatus(status))
                .map(t -> PaginatedResponse.of(t.getT1(), t.getT2(), page, size));
    }

    public Mono<AdminMentorshipSessionDTO> getSessionById(Integer sessionId) {
        return adminMentorshipRepository.findById(sessionId)
                .switchIfEmpty(Mono.defer(() -> Mono.error(new ApplicationException(ErrorCode.SESSION_NOT_FOUND))))
                .flatMap(this::enrichSession);
    }

    public Mono<AdminMentorshipSessionDTO> updateSessionStatus(Integer sessionId, String status) {
        log.info("Admin updating session {} -> status {}", sessionId, status);
        return adminMentorshipRepository.findById(sessionId)
                .switchIfEmpty(Mono.defer(() -> Mono.error(new ApplicationException(ErrorCode.SESSION_NOT_FOUND))))
                .flatMap(s -> sessionRepo.updateStatus(sessionId, status).then(adminMentorshipRepository.findById(sessionId)))
                .flatMap(this::enrichSession);
    }

    public Mono<Void> deleteSession(Integer sessionId) {
        log.info("Admin deleting session {}", sessionId);
        return adminMentorshipRepository.findById(sessionId)
                .switchIfEmpty(Mono.defer(() -> Mono.error(new ApplicationException(ErrorCode.SESSION_NOT_FOUND))))
                .flatMap(s -> sessionRepo.deleteById(sessionId));
    }

    public Mono<PaginatedResponse<AdminMentorProfileDTO>> getAllMentorProfiles(int page, int size) {
        log.info("Admin fetching all mentor profiles - page {} size {}", page, size);
        int offset = page * size;
        return enrichMentors(adminMentorshipRepository.findAllMentorProfiles(size, offset))
                .collectList()
                .zipWith(adminMentorshipRepository.countAllMentorProfiles())
                .map(t -> PaginatedResponse.of(t.getT1(), t.getT2(), page, size));
    }

    public Mono<PaginatedResponse<AdminMentorProfileDTO>> getMentorProfilesByApproval(Boolean isApproved, int page, int size) {
        log.info("Admin fetching mentor profiles by approval {} - page {} size {}", isApproved, page, size);
        int offset = page * size;
        return enrichMentors(adminMentorshipRepository.findMentorProfilesByApproval(isApproved, size, offset))
                .collectList()
                .zipWith(adminMentorshipRepository.countMentorProfilesByApproval(isApproved))
                .map(t -> PaginatedResponse.of(t.getT1(), t.getT2(), page, size));
    }

    public Mono<AdminMentorProfileDTO> approveMentor(Integer memberId) {
        log.info("Admin approving mentor {}", memberId);
        return adminMentorshipRepository.findMentorProfileById(memberId)
                .switchIfEmpty(Mono.defer(() -> Mono.error(new ApplicationException(ErrorCode.MENTOR_PROFILE_NOT_FOUND))))
                .flatMap(p -> mentorProfileRepo.approveMentor(memberId).then(adminMentorshipRepository.findMentorProfileById(memberId)))
                .flatMap(this::enrichMentor);
    }

    public Mono<MentorshipStatisticsDTO> getStatistics() {
        log.info("Admin fetching mentorship statistics");
        return Mono.zip(
                        adminMentorshipRepository.countAllSessions().defaultIfEmpty(0L),
                        adminMentorshipRepository.countSessionsByStatus(STATUS_PENDING).defaultIfEmpty(0L),
                        adminMentorshipRepository.countSessionsByStatus(STATUS_CONFIRMED).defaultIfEmpty(0L),
                        adminMentorshipRepository.countSessionsByStatus(STATUS_COMPLETED).defaultIfEmpty(0L),
                        adminMentorshipRepository.countSessionsByStatus(STATUS_CANCELLED).defaultIfEmpty(0L),
                        adminMentorshipRepository.countSessionsByStatus(STATUS_REJECTED).defaultIfEmpty(0L),
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
                                .build()));
    }

    private Flux<AdminMentorshipSessionDTO> enrichSessions(Flux<MentorshipSession> sessions) {
        return sessions.concatMap(this::enrichSession);
    }

    private Mono<AdminMentorshipSessionDTO> enrichSession(MentorshipSession s) {
        Mono<MentorAvailability> availMono = s.getAvailabilityId() != null
                ? availabilityRepo.findById(s.getAvailabilityId()).defaultIfEmpty(new MentorAvailability())
                : Mono.just(new MentorAvailability());

        Mono<User> menteeMono = s.getMenteeMemberId() != null
                ? adminUserRepository.findById(s.getMenteeMemberId()).defaultIfEmpty(new User())
                : Mono.just(new User());

        return availMono.flatMap(avail ->
                menteeMono.flatMap(mentee -> {
                    Mono<User> mentorMono = avail.getMentorMemberId() != null
                            ? adminUserRepository.findById(avail.getMentorMemberId()).defaultIfEmpty(new User())
                            : Mono.just(new User());
                    return mentorMono.map(mentor -> AdminMentorshipSessionDTO.builder()
                            .id(s.getId())
                            .availabilityId(s.getAvailabilityId())
                            .menteeMemberId(s.getMenteeMemberId())
                            .menteeName(mentee.getUserName())
                            .menteeEmail(mentee.getEmail())
                            .mentorMemberId(avail.getMentorMemberId())
                            .mentorName(mentor.getUserName())
                            .mentorEmail(mentor.getEmail())
                            .status(s.getStatus())
                            .sessionType(s.getSessionType())
                            .bookingNote(s.getBookingNote())
                            .introduction(s.getIntroduction())
                            .description(s.getDescription())
                            .meetingLink(s.getMeetingLink())
                            .cvUrl(s.getCvUrl())
                            .startTime(avail.getStartTime())
                            .endTime(avail.getEndTime())
                            .createdAt(s.getCreatedAt())
                            .build());
                }));
    }

    private Flux<AdminMentorProfileDTO> enrichMentors(Flux<MentorProfile> profiles) {
        return profiles.concatMap(this::enrichMentor);
    }

    private Mono<AdminMentorProfileDTO> enrichMentor(MentorProfile p) {
        Mono<User> userMono = p.getMemberId() != null
                ? adminUserRepository.findById(p.getMemberId()).defaultIfEmpty(new User())
                : Mono.just(new User());

        return userMono.map(u -> AdminMentorProfileDTO.builder()
                .memberId(p.getMemberId())
                .mentorName(u.getUserName())
                .mentorEmail(u.getEmail())
                .currentJobTitle(p.getCurrentJobTitle())
                .currentCompany(p.getCurrentCompany())
                .bio(p.getBio())
                .ratingAvg(p.getRatingAvg())
                .totalSessions(p.getTotalSessions())
                .isApproved(p.getIsApproved())
                .coverUrl(p.getCoverUrl())
                .createdAt(p.getCreatedAt())
                .build());
    }
}
