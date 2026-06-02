package com.service.backend.chat.service;

import com.service.backend.chat.dao.ChatGroupMemberRepository;
import com.service.backend.chat.dto.RecentChatPreviewResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChatRecentPreviewService {

    private final ChatGroupMemberRepository chatGroupMemberRepository;

    /**
     * Returns up to 5 most recent chat groups the member participates in,
     * ordered by the latest message timestamp descending.
     * Groups without any messages are excluded.
     */
    public Flux<RecentChatPreviewResponse> getTop5RecentChatPreviews(Long memberId) {
        log.info("Fetching top-5 recent chat previews for memberId={}", memberId);
        return chatGroupMemberRepository.findTop5RecentChatPreviewsByMemberId(memberId);
    }
}
