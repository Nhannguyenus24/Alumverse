package com.service.backend.mentorship.service;

import com.service.backend.mentorship.dao.MentorshipSessionR2dbcRepository;
import com.service.backend.mentorship.dao.MentorProfileR2dbcRepository;
import com.service.backend.mentorship.dto.MentorshipHubStatsResponse;
import com.service.backend.user.dao.UserOrganizationMemberRepository;
import com.service.backend.shared.utils.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class MentorshipHubService {
    private final MentorshipSessionR2dbcRepository sessionRepository;
    private final MentorProfileR2dbcRepository profileRepository;
    private final UserOrganizationMemberRepository memberRepository;

    public Mono<MentorshipHubStatsResponse> getHubStats(Integer limit) {
        return SecurityUtils.getCurrentOrganizationId()
                .flatMap(orgId -> Mono.zip(
                        // Total mentors
                        profileRepository.countApprovedMentors(orgId),
                        // Total sessions
                        sessionRepository.countAllByOrganizationId(orgId),
                        // Confirmed alumni
                        memberRepository.countConfirmedAlumni(orgId),
                        // Upcoming sessions
                        sessionRepository.findUpcomingSessions(LocalDateTime.now(), orgId, limit)
                                .map(session -> MentorshipHubStatsResponse.UpcomingSessionDto.builder()
                                        .sessionId(session.getId())
                                        .mentorName(session.getMentorName())
                                        .menteeName(session.getMenteeName())
                                        .sessionTime(session.getSessionTime())
                                        .status(session.getStatus())
                                        .build())
                                .collectList(),
                        // Confirmed alumni list
                        memberRepository.findConfirmedAlumni(orgId, limit)
                                .map(alumni -> MentorshipHubStatsResponse.ConfirmedAlumniDto.builder()
                                        .memberId(alumni.memberId())
                                        .fullName(alumni.fullName())
                                        .avatarUrl(alumni.avatarUrl())
                                        .currentJobTitle(alumni.currentJobTitle())
                                        .currentCompany(alumni.currentCompany())
                                        .build())
                                .collectList()
                )
                .map(tuple -> MentorshipHubStatsResponse.builder()
                        .totalMentorsCount(Math.toIntExact(tuple.getT1()))
                        .totalSessionsCount(Math.toIntExact(tuple.getT2()))
                        .confirmedAlumniCount(Math.toIntExact(tuple.getT3()))
                        .upcomingSessionsCount(tuple.getT4().size())
                        .upcomingSessions(tuple.getT4())
                        .confirmedAlumni(tuple.getT5())
                        .build())
        );
    }
}
