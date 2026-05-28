package com.service.backend.chat.service;

import com.service.backend.chat.dao.ChatConversationRequestRepository;
import com.service.backend.chat.entity.ChatConversationRequest;
import com.service.backend.shared.constants.ErrorCode;
import com.service.backend.shared.enums.ConversationRequestStatus;
import com.service.backend.shared.exception.ApplicationException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

@Service
@RequiredArgsConstructor
public class ChatConversationRequestService {

    private final ChatConversationRequestRepository chatConversationRequestRepository;

    /**
     * Looks up a conversation request by the canonical member pair (low id, high id).
     * Returns empty when no record exists for the pair.
     */
    public Mono<ConversationRequestStatus> getConversationRequestStatus(
            Long currentMemberId,
            Long targetMemberId) {
        if (currentMemberId == null || targetMemberId == null) {
            return Mono.error(new ApplicationException(ErrorCode.USER_NOT_FOUND, "Member IDs must not be null"));
        }

        if (currentMemberId.equals(targetMemberId)) {
            return Mono.error(new ApplicationException(
                    ErrorCode.USER_NOT_FOUND,
                    "Cannot check conversation request status with yourself"));
        }

        long memberLowId = Math.min(currentMemberId, targetMemberId);
        long memberHighId = Math.max(currentMemberId, targetMemberId);

        return chatConversationRequestRepository
                .findByMemberPair(memberLowId, memberHighId)
                .map(ChatConversationRequest::getStatus);
    }
}
