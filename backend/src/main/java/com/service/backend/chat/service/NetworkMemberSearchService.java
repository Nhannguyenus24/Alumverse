package com.service.backend.chat.service;

import java.util.List;

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
            List<Integer> organizationIds,
            String fullName,
            String program,
            String major,
            int page,
            int size) {

        String fullNamePattern = toContainsPattern(fullName);
        String programPattern = toContainsPattern(program);
        String majorPattern = toContainsPattern(major);

        int offset = page * size;

        // No organization selected → the directory spans every organization.
        // The repository's IN-clause still needs a non-empty list to be valid
        // SQL, so pass a sentinel that matches nothing; it is short-circuited
        // by filterByOrg = false.
        boolean filterByOrg = organizationIds != null && !organizationIds.isEmpty();
        List<Integer> orgIds = filterByOrg ? organizationIds : List.of(-1);

        return SecurityUtils.getCurrentUserId()
                .flatMap(currentUserId -> {
                    Mono<Long> totalMono = networkMemberSearchRepository.countSearchMembers(
                            filterByOrg,
                            orgIds,
                            currentUserId,
                            fullNamePattern,
                            programPattern,
                            majorPattern);

                    return PaginationHelper.paginate(
                            networkMemberSearchRepository.searchMembers(
                                    filterByOrg,
                                    orgIds,
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
