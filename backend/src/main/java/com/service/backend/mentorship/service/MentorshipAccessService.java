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

    public static final int MIN_ORG_VERIFIED_LEVEL = 2;

    private static final String MSG_EMAIL_VERIFICATION =
            "Vui lòng xác thực email để tiếp tục sử dụng các tính năng cộng đồng.";
    private static final String MSG_ORG_VERIFICATION =
            "Bạn cần xác minh thông tin học vấn tại khoa để sử dụng tính năng này.";
    private static final String MSG_MENTOR_NOT_APPROVED =
            "Hồ sơ mentor của bạn chưa được khoa duyệt.";

    private final AuthRepository authRepository;
    private final MentorProfileR2dbcRepository mentorProfileRepository;

    public Mono<Integer> getCurrentVerificationLevel() {
        return SecurityUtils.getCurrentUserId()
                .zipWith(SecurityUtils.getCurrentOrganizationId())
                .flatMap(tuple -> authRepository.getVerificationLevelByUserIdAndOrgId(
                        tuple.getT1().intValue(),
                        tuple.getT2()))
                .defaultIfEmpty(0);
    }

    public Mono<Void> requireMinVerificationLevel(int minLevel) {
        return getCurrentVerificationLevel()
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

    public Mono<Void> requireOrgVerifiedForMentorship() {
        return requireMinVerificationLevel(MIN_ORG_VERIFIED_LEVEL);
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
        return mentorProfileRepository.findById(mentorMemberId)
                .switchIfEmpty(Mono.error(new ApplicationException(
                        ErrorCode.MENTOR_PROFILE_NOT_FOUND,
                        "Không tìm thấy hồ sơ mentor")))
                .flatMap(profile -> {
                    if (!Status.APPROVED.equals(profile.getStatus())) {
                        return Mono.error(new ApplicationException(
                                ErrorCode.MENTOR_PROFILE_NOT_FOUND,
                                "Không tìm thấy hồ sơ mentor"));
                    }
                    return Mono.just(profile);
                });
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
