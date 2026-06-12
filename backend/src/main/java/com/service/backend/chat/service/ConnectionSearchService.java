package com.service.backend.chat.service;

import com.service.backend.chat.dao.ConnectionSearchRepository;
import com.service.backend.chat.dto.ConnectionSearchItemResponse;
import com.service.backend.shared.dto.PaginatedResponse;
import com.service.backend.shared.utils.PaginationHelper;
import com.service.backend.shared.utils.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Mono;

@Service
@RequiredArgsConstructor
public class ConnectionSearchService {

    private final ConnectionSearchRepository connectionSearchRepository;

    public Mono<PaginatedResponse<ConnectionSearchItemResponse>> searchConnections(
            String fullName,
            int page,
            int size) {

        String fullNamePattern = toContainsPattern(fullName);
        int offset = page * size;

        return Mono.zip(
                        SecurityUtils.getCurrentOrganizationId(),
                        SecurityUtils.getCurrentUserId())
                .flatMap(tuple -> {
                    Integer organizationId = tuple.getT1();
                    Long currentUserId = tuple.getT2();

                    Mono<Long> totalMono = connectionSearchRepository.countConnections(
                            organizationId,
                            currentUserId,
                            fullNamePattern);

                    return PaginationHelper.paginate(
                            connectionSearchRepository.searchConnections(
                                    organizationId,
                                    currentUserId,
                                    fullNamePattern,
                                    size,
                                    offset),
                            totalMono,
                            page,
                            size);
                });
    }

    private static String toContainsPattern(String raw) {
        if (!StringUtils.hasText(raw)) {
            return null;
        }
        return "%" + raw.trim() + "%";
    }
}
