package com.service.backend.chat.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import com.service.backend.chat.dao.NetworkMemberSearchRepository;
import com.service.backend.chat.dto.NetworkMemberSearchItemResponse;
import com.service.backend.shared.dto.PaginatedResponse;
import com.service.backend.shared.utils.JsonUtils;
import com.service.backend.shared.utils.SecurityUtils;

import lombok.RequiredArgsConstructor;
import reactor.core.publisher.Mono;

@Service
@RequiredArgsConstructor
public class NetworkMemberSearchService {

    private static final Logger log = LoggerFactory.getLogger(NetworkMemberSearchService.class);

    private final NetworkMemberSearchRepository networkMemberSearchRepository;

    public Mono<PaginatedResponse<NetworkMemberSearchItemResponse>> searchMembers(
            String fullName,
            String program,
            String major,
            Integer startYear,
            int page,
            int size) {

        String fullNamePattern = toContainsPattern(fullName);
        String programJson = toExactJsonArray(program);
        String majorJson = toExactJsonArray(major);

        int offset = page * size;

        return SecurityUtils.getCurrentOrganizationId()
                .flatMap(organizationId -> {
                    log.info(
                            "Searching network members orgId={} fullName={} program={} major={} startYear={} page={} size={}",
                            organizationId,
                            fullNamePattern != null,
                            programJson != null,
                            majorJson != null,
                            startYear,
                            page,
                            size);

                    Mono<Long> totalMono = networkMemberSearchRepository.countSearchMembers(
                            organizationId,
                            fullNamePattern,
                            programJson,
                            majorJson,
                            startYear);

                    return networkMemberSearchRepository
                            .searchMembers(
                                    organizationId,
                                    fullNamePattern,
                                    programJson,
                                    majorJson,
                                    startYear,
                                    size,
                                    offset)
                            .collectList()
                            .zipWith(totalMono)
                            .map(tuple -> PaginatedResponse.of(tuple.getT1(), tuple.getT2(), page, size));
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

        /**
         * Convert an exact filter value into a single-element JSON array string for jsonb @>.
         */
        private static String toExactJsonArray(String raw) {
                if (!StringUtils.hasText(raw)) {
                        return null;
                }
                return JsonUtils.toJson(java.util.List.of(raw.trim()));
        }
}
