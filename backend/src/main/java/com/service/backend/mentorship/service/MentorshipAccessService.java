package com.service.backend.mentorship.service;

import com.service.backend.auth.dao.AuthRepository;
import com.service.backend.mentorship.dao.MentorProfileR2dbcRepository;
import com.service.backend.shared.entity.MentorProfile;
import com.service.backend.shared.enums.ErrorCode;
import com.service.backend.shared.enums.Status;
import com.service.backend.shared.exception.ApplicationException;
import com.service.backend.shared.utils.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

/**
 * Resolves organization-scoped verification level and enforces mentorship access rules.
 */
@Service
@RequiredArgsConstructor
public class MentorshipAccessService {

    public static final int MIN_EMAIL_VERIFIED_LEVEL = 1;
    public static final int MIN_ORG_VERIFIED_LEVEL = 2;

    private static final String MSG_EMAIL_VERIFICATION =
            "Vui lòng xác thực email để tiếp tục sử dụng các tính năng cộng đồng.";
    private static final String MSG_ORG_VERIFICATION =
            "Bạn cần xác minh thông tin học vấn tại khoa để sử dụng tính năng này.";
    private static final String MSG_MENTOR_NOT_APPROVED =
            "Hồ sơ mentor của bạn chưa được khoa duyệt.";

    private final AuthRepository authRepository;
    private final MentorProfileR2dbcRepository mentorProfileRepository;

    private Mono<Boolean> isGlobalMentorshipReviewerRole() {
        return SecurityUtils.getCurrentUserRole()
                .map(role -> "ADMIN".equalsIgnoreCase(role))
                .defaultIfEmpty(false)
                .onErrorReturn(false);
    }

    public Mono<Integer> getCurrentVerificationLevel() {
        return SecurityUtils.getCurrentUserId()
                .zipWith(SecurityUtils.getCurrentOrganizationId())
                .flatMap(tuple -> authRepository.getVerificationLevelByUserIdAndOrgId(
                        tuple.getT1().intValue(),
                        tuple.getT2()))
                .defaultIfEmpty(0);
    }

    public Mono<Integer> getVerificationLevel(Integer organizationId) {
        if (organizationId == null) {
            return getCurrentVerificationLevel();
        }
        return SecurityUtils.getCurrentUserId()
                .flatMap(userId -> authRepository.getVerificationLevelByUserIdAndOrgId(
                        userId.intValue(),
                        organizationId))
                .defaultIfEmpty(0);
    }

    public Mono<Void> requireMinVerificationLevel(int minLevel) {
        return requireMinVerificationLevel(minLevel, null);
    }

    public Mono<Void> requireMinVerificationLevel(int minLevel, Integer organizationId) {
        return getVerificationLevel(organizationId)
                .flatMap(level -> {
                    int current = level != null ? level : 0;
                    if (current >= minLevel) {
                        return Mono.empty();
                    }
                    if (current < 1) {
                        return Mono.error(new ApplicationException(
                                ErrorCode.ACCOUNT_NOT_VERIFIED,
                                MSG_EMAIL_VERIFICATION));
                    }
                    return Mono.error(new ApplicationException(
                            ErrorCode.FORBIDDEN,
                            MSG_ORG_VERIFICATION));
                });
    }

    public Mono<Void> requireEmailVerifiedForMentorBrowse() {
        return requireEmailVerifiedForMentorBrowse(null);
    }

    public Mono<Void> requireEmailVerifiedForMentorBrowse(Integer organizationId) {
        return isGlobalMentorshipReviewerRole()
                .flatMap(isReviewer -> isReviewer
                        ? Mono.empty()
                        : requireMinVerificationLevel(MIN_EMAIL_VERIFIED_LEVEL, organizationId));
    }

    public Mono<Void> requireOrgVerifiedForMentorship() {
        return requireMinVerificationLevel(MIN_ORG_VERIFIED_LEVEL);
    }

    public Mono<Boolean> isOrgVerifiedForMentorship() {
        return isOrgVerifiedForMentorship(null);
    }

    public Mono<Boolean> isOrgVerifiedForMentorship(Integer organizationId) {
        return getVerificationLevel(organizationId)
                .map(level -> level != null && level >= MIN_ORG_VERIFIED_LEVEL);
    }

    public Mono<Boolean> canViewFullMentorBrowse() {
        return canViewFullMentorBrowse(null);
    }

    public Mono<Boolean> canViewFullMentorBrowse(Integer organizationId) {
        return isGlobalMentorshipReviewerRole()
                .flatMap(isReviewer -> isReviewer ? Mono.just(true) : isOrgVerifiedForMentorship(organizationId));
    }

    /**
     * Returns an approved mentor profile or responds as not found to avoid exposing pending profiles.
     */
    public Mono<MentorProfile> requireApprovedMentorProfile(Integer mentorMemberId) {
        if (mentorMemberId == null) {
            return Mono.error(new ApplicationException(
                    ErrorCode.MENTOR_PROFILE_NOT_FOUND,
                    "Không tìm thấy hồ sơ mentor"));
        }
        return mentorProfileRepository.findApprovedMentor(mentorMemberId, null)
                .switchIfEmpty(Mono.error(new ApplicationException(
                        ErrorCode.MENTOR_PROFILE_NOT_FOUND,
                        "Không tìm thấy hồ sơ mentor")));
    }

    public Mono<MentorProfile> requireApprovedMentorProfile(Integer mentorMemberId, Integer organizationId) {
        if (mentorMemberId == null) {
            return Mono.error(new ApplicationException(
                    ErrorCode.MENTOR_PROFILE_NOT_FOUND,
                    "Không tìm thấy hồ sơ mentor"));
        }
        return mentorProfileRepository.findApprovedMentor(mentorMemberId, organizationId)
                .switchIfEmpty(Mono.error(new ApplicationException(
                        ErrorCode.MENTOR_PROFILE_NOT_FOUND,
                        "Không tìm thấy hồ sơ mentor")));
    }

    public Mono<Void> requireCurrentUserApprovedMentor() {
        return SecurityUtils.getCurrentUserId()
                .map(Long::intValue)
                .flatMap(memberId -> mentorProfileRepository.findById(memberId)
                        .switchIfEmpty(Mono.error(new ApplicationException(
                                ErrorCode.MENTOR_PROFILE_NOT_FOUND,
                                "Không tìm thấy hồ sơ mentor")))
                        .flatMap(profile -> {
                            if (!Status.APPROVED.equals(profile.getStatus())) {
                                return Mono.error(new ApplicationException(
                                        ErrorCode.FORBIDDEN,
                                        MSG_MENTOR_NOT_APPROVED));
                            }
                            return Mono.empty();
                        }));
    }
}
