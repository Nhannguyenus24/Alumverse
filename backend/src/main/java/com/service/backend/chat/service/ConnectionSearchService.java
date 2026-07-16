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

        // Connections are personal and org-agnostic: return all accepted connections of the
        // current user regardless of organization.
        return SecurityUtils.getCurrentUserId()
                .flatMap(currentUserId -> {
                    Mono<Long> totalMono = connectionSearchRepository.countConnections(
                            currentUserId,
                            fullNamePattern);

                    return PaginationHelper.paginate(
                            connectionSearchRepository.searchConnections(
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
