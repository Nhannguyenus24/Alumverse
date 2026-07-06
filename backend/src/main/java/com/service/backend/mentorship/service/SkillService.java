package com.service.backend.mentorship.service;

import com.service.backend.mentorship.dao.MentorSkillR2dbcRepository;
import com.service.backend.mentorship.dao.SkillR2dbcRepository;
import com.service.backend.mentorship.dto.SkillResponse;
import com.service.backend.shared.dto.PaginatedResponse;
import com.service.backend.shared.entity.MentorSkill;
import com.service.backend.shared.entity.Skill;
import com.service.backend.shared.utils.PaginationHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Normalized skill catalog used by mentor signup (priority-ordered tags) and
 * the "filter by skill" search on the mentor browse page.
 */
@Service
@RequiredArgsConstructor
public class SkillService {

    private final SkillR2dbcRepository skillRepository;
    private final MentorSkillR2dbcRepository mentorSkillRepository;

    public Mono<PaginatedResponse<SkillResponse>> searchSkills(String search, int page, int limit) {
        int offset = page * limit;
        String normalized = (search == null || search.isBlank()) ? null : search.trim();
        return PaginationHelper.paginate(
                skillRepository.search(normalized, limit, offset).map(SkillResponse::from),
                skillRepository.countSearch(normalized),
                page, limit);
    }

    public Mono<List<SkillResponse>> getMentorSkills(Integer mentorMemberId) {
        return mentorSkillRepository.findByMentorMemberIdOrderByDisplayOrder(mentorMemberId)
                .collectList()
                .flatMap(this::resolveOrdered);
    }

    private Mono<List<SkillResponse>> resolveOrdered(List<MentorSkill> mentorSkills) {
        if (mentorSkills.isEmpty()) return Mono.just(List.of());
        List<Integer> ids = mentorSkills.stream().map(MentorSkill::getSkillId).toList();
        return skillRepository.findByIds(ids).collectMap(Skill::getId)
                .map(byId -> mentorSkills.stream()
                        .map(ms -> byId.get(ms.getSkillId()))
                        .filter(java.util.Objects::nonNull)
                        .map(SkillResponse::from)
                        .toList());
    }

    /**
     * Replaces the mentor's skill list with the given names, preserving the
     * caller-provided order as the priority (first = most important). Unknown
     * names are created in the catalog on the fly; duplicates (case-insensitive)
     * are collapsed keeping the first occurrence.
     */
    public Mono<Void> replaceMentorSkills(Integer mentorMemberId, List<String> orderedNames) {
        List<String> deduped = dedupePreservingOrder(orderedNames);
        if (deduped.isEmpty()) {
            return mentorSkillRepository.deleteByMentorMemberId(mentorMemberId);
        }
        return Flux.fromIterable(deduped)
                .concatMap(this::getOrCreateByName)
                .collectList()
                .flatMap(skills -> mentorSkillRepository.deleteByMentorMemberId(mentorMemberId)
                        .thenMany(Flux.range(0, skills.size())
                                .concatMap(i -> mentorSkillRepository.save(MentorSkill.builder()
                                        .mentorMemberId(mentorMemberId)
                                        .skillId(skills.get(i).getId())
                                        .displayOrder(i)
                                        .build())))
                        .then());
    }

    private Mono<Skill> getOrCreateByName(String name) {
        String trimmed = name.trim();
        return skillRepository.findByNameIgnoreCase(trimmed)
                .switchIfEmpty(Mono.defer(() -> skillRepository.save(Skill.builder()
                        .name(trimmed)
                        .createdAt(LocalDateTime.now())
                        .build())));
    }

    private static List<String> dedupePreservingOrder(List<String> names) {
        if (names == null) return List.of();
        Map<String, String> byLower = new LinkedHashMap<>();
        for (String name : names) {
            if (name == null || name.isBlank()) continue;
            byLower.putIfAbsent(name.trim().toLowerCase(), name.trim());
        }
        return List.copyOf(byLower.values());
    }
}
