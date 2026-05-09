package com.service.backend.admin.service;

import com.service.backend.mentorship.dao.MentorAvailabilityR2dbcRepository;
import com.service.backend.mentorship.dto.MentorshipSessionResponse;
import com.service.backend.mentorship.entity.MentorshipSession;
import com.service.backend.shared.dao.UserDisplayInfo;
import com.service.backend.shared.dao.UserDisplayInfoRepository;
import com.service.backend.shared.dto.PaginatedResponse;
import org.springframework.r2dbc.core.DatabaseClient;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
public class AdminMentorshipService {

    private final DatabaseClient databaseClient;
    private final MentorAvailabilityR2dbcRepository availabilityRepository;
    private final UserDisplayInfoRepository userDisplayInfoRepository;

    public AdminMentorshipService(DatabaseClient databaseClient,
                                  MentorAvailabilityR2dbcRepository availabilityRepository,
                                  UserDisplayInfoRepository userDisplayInfoRepository) {
        this.databaseClient = databaseClient;
        this.availabilityRepository = availabilityRepository;
        this.userDisplayInfoRepository = userDisplayInfoRepository;
    }

    public Mono<PaginatedResponse<MentorshipSessionResponse>> getAllSessions(int page, int size) {
        int offset = page * size;
        
        Mono<List<MentorshipSession>> sessionsMono = databaseClient.sql("SELECT * FROM mentorship_sessions ORDER BY created_at DESC LIMIT :limit OFFSET :offset")
                .bind("limit", size)
                .bind("offset", offset)
                .map((row, metadata) -> {
                    MentorshipSession s = new MentorshipSession();
                    s.setId(row.get("id", Integer.class));
                    s.setAvailabilityId(row.get("availability_id", Integer.class));
                    s.setMenteeMemberId(row.get("mentee_member_id", Integer.class));
                    s.setStatus(row.get("status", String.class));
                    s.setBookingNote(row.get("booking_note", String.class));
                    s.setMeetingLink(row.get("meeting_link", String.class));
                    s.setSessionType(row.get("session_type", String.class));
                    s.setIntroduction(row.get("introduction", String.class));
                    s.setDescription(row.get("description", String.class));
                    s.setCvUrl(row.get("cv_url", String.class));
                    s.setCreatedAt(row.get("created_at", java.time.LocalDateTime.class));
                    return s;
                })
                .all()
                .collectList();

        Mono<Long> countMono = databaseClient.sql("SELECT COUNT(*) FROM mentorship_sessions")
                .map((row, metadata) -> row.get(0, Long.class))
                .one()
                .defaultIfEmpty(0L);

        return sessionsMono.flatMap(list -> enrichAll(list)
                .zipWith(countMono)
                .map(tuple -> PaginatedResponse.of(tuple.getT1(), tuple.getT2(), page, size))
        );
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
        Set<Integer> memberIds = new HashSet<>();
        for (MentorshipSessionResponse r : list) {
            if (r.getMentorMemberId() != null) memberIds.add(r.getMentorMemberId());
            if (r.getMenteeMemberId() != null) memberIds.add(r.getMenteeMemberId());
        }
        if (memberIds.isEmpty()) return Mono.just(list);
        
        return userDisplayInfoRepository.findByMemberIds(memberIds)
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
}
