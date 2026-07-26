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
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collection;
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

    /**
     * Batch variant of {@link #getMentorSkills}: resolves the ordered skill tags for many mentors
     * using two queries total (mentor_skills IN, then skills IN) instead of 2 queries per mentor.
     */
    public Mono<Map<Integer, List<SkillResponse>>> getMentorSkills(Collection<Integer> mentorMemberIds) {
        if (mentorMemberIds == null || mentorMemberIds.isEmpty()) return Mono.just(Map.of());
        return mentorSkillRepository.findByMentorMemberIdsOrderByDisplayOrder(mentorMemberIds.stream().distinct().toList())
                .collectList()
                .flatMap(mentorSkills -> {
                    if (mentorSkills.isEmpty()) return Mono.just(Map.of());
                    List<Integer> skillIds = mentorSkills.stream().map(MentorSkill::getSkillId).distinct().toList();
                    return skillRepository.findByIds(skillIds).collectMap(Skill::getId)
                            .map(byId -> {
                                Map<Integer, List<SkillResponse>> result = new LinkedHashMap<>();
                                for (MentorSkill ms : mentorSkills) {
                                    Skill skill = byId.get(ms.getSkillId());
                                    if (skill == null) continue;
                                    result.computeIfAbsent(ms.getMentorMemberId(), k -> new ArrayList<>())
                                            .add(SkillResponse.from(skill));
                                }
                                return result;
                            });
                });
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
        return getOrCreateByNames(deduped)
                .flatMap(byLowerName -> {
                    // Rebuild the skill list in the caller-provided priority order.
                    List<MentorSkill> toInsert = new ArrayList<>();
                    int order = 0;
                    for (String name : deduped) {
                        Skill skill = byLowerName.get(name.trim().toLowerCase());
                        if (skill == null) continue;
                        toInsert.add(MentorSkill.builder()
                                .mentorMemberId(mentorMemberId)
                                .skillId(skill.getId())
                                .displayOrder(order++)
                                .build());
                    }
                    return mentorSkillRepository.deleteByMentorMemberId(mentorMemberId)
                            .thenMany(mentorSkillRepository.saveAll(toInsert))
                            .then();
                });
    }

    /**
     * Resolves the given (trimmed, de-duped) names to {@link Skill} rows keyed by lower-cased name,
     * creating any names not yet in the catalog. Uses one IN query instead of one lookup per name.
     */
    private Mono<Map<String, Skill>> getOrCreateByNames(List<String> names) {
        List<String> lowerNames = names.stream().map(n -> n.trim().toLowerCase()).toList();
        return skillRepository.findByNamesIgnoreCase(lowerNames)
                .collectMap(s -> s.getName().trim().toLowerCase(), s -> s)
                .flatMap(existing -> {
                    List<String> missing = names.stream()
                            .filter(n -> !existing.containsKey(n.trim().toLowerCase()))
                            .toList();
                    if (missing.isEmpty()) return Mono.just(existing);
                    List<Skill> newSkills = missing.stream()
                            .map(n -> Skill.builder().name(n.trim()).createdAt(LocalDateTime.now()).build())
                            .toList();
                    return skillRepository.saveAll(newSkills)
                            .collectList()
                            .map(created -> {
                                Map<String, Skill> all = new LinkedHashMap<>(existing);
                                for (Skill s : created) all.put(s.getName().trim().toLowerCase(), s);
                                return all;
                            });
                });
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
