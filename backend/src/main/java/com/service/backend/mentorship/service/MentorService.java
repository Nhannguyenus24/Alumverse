package com.service.backend.mentorship.service;

import com.service.backend.mentorship.dao.*;
import com.service.backend.mentorship.dto.*;
import com.service.backend.mentorship.entity.MentorAvailability;
import com.service.backend.mentorship.entity.MentorExpertise;
import com.service.backend.mentorship.entity.MentorProfile;
import com.service.backend.shared.dto.PaginatedResponse;
import com.service.backend.shared.constants.ErrorCode;
import com.service.backend.shared.exception.ApplicationException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class MentorService {

    private final MentorProfileR2dbcRepository profileRepository;
    private final MentorExpertiseR2dbcRepository expertiseRepository;
    private final MentorAvailabilityR2dbcRepository availabilityRepository;
    private final MentorshipSessionR2dbcRepository sessionRepository;
    private final SessionFeedbackR2dbcRepository feedbackRepository;

    private static final Integer MOCK_MEMBER_ID = 1;

    // ===================== PROFILE =====================

    public Mono<MentorProfileResponse> createProfile(CreateMentorProfileRequest request) {
        return profileRepository.findById(MOCK_MEMBER_ID)
                .flatMap(existing -> Mono.<MentorProfile>error(
                        new ApplicationException(ErrorCode.MENTOR_PROFILE_ALREADY_EXISTS, "Mentor profile already exists")))
                .switchIfEmpty(Mono.defer(() -> {
                    MentorProfile profile = MentorProfile.builder()
                            .memberId(MOCK_MEMBER_ID)
                            .currentJobTitle(request.getCurrentJobTitle())
                            .currentCompany(request.getCurrentCompany())
                            .bio(request.getBio())
                            .ratingAvg(java.math.BigDecimal.ZERO)
                            .totalSessions(0)
                            .isApproved(false)
                            .createdAt(LocalDateTime.now())
                            .build();
                    return profileRepository.save(profile);
                }))
                .map(MentorProfileResponse::from);
    }

    public Mono<MentorProfileResponse> updateProfile(UpdateMentorProfileRequest request) {
        return profileRepository.findById(MOCK_MEMBER_ID)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.MENTOR_PROFILE_NOT_FOUND, "Mentor profile not found")))
                .flatMap(existing -> {
                    existing.setCurrentJobTitle(request.getCurrentJobTitle());
                    existing.setCurrentCompany(request.getCurrentCompany());
                    existing.setBio(request.getBio());
                    existing.setNew(false);
                    return profileRepository.save(existing);
                })
                .map(MentorProfileResponse::from);
    }

    public Mono<MentorProfileResponse> getMyProfile() {
        return profileRepository.findById(MOCK_MEMBER_ID)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.MENTOR_PROFILE_NOT_FOUND, "Mentor profile not found")))
                .map(MentorProfileResponse::from);
    }

    // ===================== EXPERTISE =====================

    public Mono<MentorExpertiseResponse> addExpertise(CreateExpertiseRequest request) {
        MentorExpertise expertise = MentorExpertise.builder()
                .mentorMemberId(MOCK_MEMBER_ID)
                .topic(request.getTopic())
                .yearsExperience(request.getYearsExperience())
                .description(request.getDescription())
                .build();

        return expertiseRepository.save(expertise)
                .map(MentorExpertiseResponse::from);
    }

    public Mono<java.util.List<MentorExpertiseResponse>> getMyExpertise() {
        return expertiseRepository.findByMentorMemberId(MOCK_MEMBER_ID)
                .map(MentorExpertiseResponse::from)
                .collectList();
    }

    public Mono<Boolean> deleteExpertise(Integer expertiseId) {
        return expertiseRepository.findById(expertiseId)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.EXPERTISE_NOT_FOUND, "Expertise not found with id: " + expertiseId)))
                .flatMap(existing -> expertiseRepository.deleteById(expertiseId).thenReturn(true));
    }

    // ===================== AVAILABILITY =====================

    public Mono<MentorAvailabilityResponse> addAvailability(CreateAvailabilityRequest request) {
        MentorAvailability availability = MentorAvailability.builder()
                .mentorMemberId(MOCK_MEMBER_ID)
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .status("Available")
                .build();

        return availabilityRepository.save(availability)
                .map(MentorAvailabilityResponse::from);
    }

    public Mono<java.util.List<MentorAvailabilityResponse>> getMyAvailabilities() {
        return availabilityRepository.findByMentorMemberId(MOCK_MEMBER_ID)
                .map(MentorAvailabilityResponse::from)
                .collectList();
    }

    public Mono<Boolean> deleteAvailability(Integer availabilityId) {
        return availabilityRepository.findById(availabilityId)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.AVAILABILITY_NOT_FOUND, "Availability not found with id: " + availabilityId)))
                .flatMap(existing -> {
                    availabilityRepository.deleteByMentorMemberIdAndId(MOCK_MEMBER_ID, availabilityId);
                    return availabilityRepository.deleteById(availabilityId).thenReturn(true);
                });
    }

    // ===================== SESSIONS (Mentor view) =====================

    public Mono<PaginatedResponse<MentorshipSessionResponse>> getMySessions(int page, int limit) {
        int offset = page * limit;
        return sessionRepository.findByMentorMemberId(MOCK_MEMBER_ID, limit, offset)
                .collectList()
                .zipWith(sessionRepository.countByMentorMemberId(MOCK_MEMBER_ID))
                .map(tuple -> PaginatedResponse.of(
                        tuple.getT1().stream().map(MentorshipSessionResponse::from).toList(),
                        tuple.getT2(), page, limit
                ));
    }

    public Mono<PaginatedResponse<MentorshipSessionResponse>> filterMySessions(
            LocalDate date, String menteeName, int page, int limit) {
        int offset = page * limit;
        return sessionRepository.filterSessionsByMentor(MOCK_MEMBER_ID, date, menteeName, limit, offset)
                .collectList()
                .zipWith(sessionRepository.countFilterSessionsByMentor(MOCK_MEMBER_ID, date, menteeName))
                .map(tuple -> PaginatedResponse.of(
                        tuple.getT1().stream().map(MentorshipSessionResponse::from).toList(),
                        tuple.getT2(), page, limit
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
                .map(MentorshipSessionResponse::from);
    }

    // ===================== FEEDBACKS (Mentor view) =====================

    public Mono<PaginatedResponse<SessionFeedbackResponse>> getMyFeedbacks(int page, int limit) {
        return feedbackRepository.findPublicFeedbacksByMentorId(MOCK_MEMBER_ID, limit, page * limit)
                .collectList()
                .zipWith(feedbackRepository.countPublicFeedbacksByMentorId(MOCK_MEMBER_ID))
                .map(tuple -> PaginatedResponse.of(
                        tuple.getT1().stream().map(SessionFeedbackResponse::from).toList(),
                        tuple.getT2(), page, limit
                ));
    }
}
