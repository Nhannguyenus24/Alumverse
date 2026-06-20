package com.service.backend.chat.service;

import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import com.service.backend.chat.dao.NetworkMemberSearchRepository;
import com.service.backend.chat.dto.NetworkMemberSearchItemResponse;
import com.service.backend.shared.dto.PaginatedResponse;
import com.service.backend.shared.utils.PaginationHelper;
import com.service.backend.shared.utils.SecurityUtils;

import lombok.RequiredArgsConstructor;
import reactor.core.publisher.Mono;

@Service
@RequiredArgsConstructor
public class NetworkMemberSearchService {

    private final NetworkMemberSearchRepository networkMemberSearchRepository;

    public Mono<PaginatedResponse<NetworkMemberSearchItemResponse>> searchMembers(
            String fullName,
            String program,
            String major,
            int page,
            int size) {

        String fullNamePattern = toContainsPattern(fullName);
        String programPattern = toContainsPattern(program);
        String majorPattern = toContainsPattern(major);

        int offset = page * size;

        return Mono.zip(
                        SecurityUtils.getCurrentOrganizationId(),
                        SecurityUtils.getCurrentUserId())
                .flatMap(tuple -> {
                    Integer organizationId = tuple.getT1();
                    Long currentUserId = tuple.getT2();

                    Mono<Long> totalMono = networkMemberSearchRepository.countSearchMembers(
                            organizationId,
                            currentUserId,
                            fullNamePattern,
                            programPattern,
                            majorPattern);

                    return PaginationHelper.paginate(
                            networkMemberSearchRepository.searchMembers(
                                    organizationId,
                                    currentUserId,
                                    fullNamePattern,
                                    programPattern,
                                    majorPattern,
                                    size,
                                    offset),
                            totalMono,
                            page,
                            size);
                });
    }

    /**
     * Blank → null (skip filter). Otherwise wrap with % for ILIKE/LIKE contains.
     */
    private static String toContainsPattern(String raw) {
        if (!StringUtils.hasText(raw)) {
            return null;
        }
        String trimmed = raw.trim();
        return "%" + trimmed + "%";
    }
}
