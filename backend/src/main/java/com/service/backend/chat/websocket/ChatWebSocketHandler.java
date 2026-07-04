package com.service.backend.chat.websocket;

import com.fasterxml.jackson.databind.JsonNode;
import com.service.backend.shared.entity.ChatMessage;
import com.service.backend.chat.dao.ChatGroupMemberRepository;
import com.service.backend.chat.service.ChatService;
import com.service.backend.shared.dao.UserDisplayInfo;
import com.service.backend.user.dao.UserProfileRepository;
import com.service.backend.shared.utils.JsonUtils;
import com.service.backend.shared.utils.JwtUtils;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.socket.WebSocketHandler;
import org.springframework.web.reactive.socket.WebSocketMessage;
import org.springframework.web.reactive.socket.WebSocketSession;
import reactor.core.publisher.Mono;
import com.service.backend.shared.exception.ApplicationException;
import com.service.backend.shared.enums.ErrorCode;

import java.util.HashMap;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * WebSocket handler for real-time chat functionality.
 * Handles JOIN_GROUP, SEND_MESSAGE (groupId, content, chatType), LEAVE_GROUP events.
 */
@Slf4j
@Component
public class ChatWebSocketHandler implements WebSocketHandler {

    private final ChatService chatService;
    private final ChatGroupMemberRepository chatGroupMemberRepository;
    private final UserProfileRepository userProfileRepository;
    private final JwtUtils jwtUtils;

    // Map: sessionId -> memberId
    private final Map<String, Long> sessionToMember = new ConcurrentHashMap<>();

    // Map: groupId -> Set of WebSocketSession
    private final Map<Long, Set<WebSocketSession>> groupToSessions = new ConcurrentHashMap<>();

    public ChatWebSocketHandler(
            ChatService chatService,
            ChatGroupMemberRepository chatGroupMemberRepository,
            UserProfileRepository userProfileRepository,
            JwtUtils jwtUtils) {
        this.chatService = chatService;
        this.chatGroupMemberRepository = chatGroupMemberRepository;
        this.userProfileRepository = userProfileRepository;
        this.jwtUtils = jwtUtils;
    }

    @Override
    public Mono<Void> handle(WebSocketSession session) {

        // Do not use SecurityUtils.getCurrentUserId() because in websocket there is no Security context holder. 
        Mono<Long> memberIdMono = extractMemberIdFromToken(session)
        .onErrorResume(error -> {
            //System.out.println("Error on extracting memberId from token: " + error.getMessage());
            log.error("Error on extracting memberId from token: " + error.getMessage());
            return Mono.error(new ApplicationException(ErrorCode.ERROR_EXTRACTING_MEMBERID_FROM_TOKEN, "Error during extracting memberId from token."));
        });

        return memberIdMono
                .flatMap(memberId -> {
                    sessionToMember.put(session.getId(), memberId);
                    log.info("WebSocket connected: sessionId={}, memberId={}", session.getId(), memberId);

                    return session.receive()
                            .map(WebSocketMessage::getPayloadAsText)
                            .flatMap(messageText -> handleMessage(session, memberId, messageText))
                            .then()
                            .doFinally(signalType -> {
                                cleanupSession(session, memberId);
                                log.info("WebSocket disconnected: sessionId={}, memberId={}", session.getId(), memberId);
                            });
                })
                .onErrorResume(error -> {
                    log.error("Error in WebSocket handler for session: {}", session.getId(), error);
                    return session.close();
                });
    }

    /**
     * Extract member ID from JWT token in query parameter or header.
     * Fallback when SecurityContext is not available (for example browser WebSocket connections).
     */
    private Mono<Long> extractMemberIdFromToken(WebSocketSession session) {
        String token = resolveTokenFromQueryParam(session);
        if (token == null || token.isBlank()) {
            return Mono.error(new RuntimeException("No authentication token found in query parameter or header"));
        }

        try {
            com.nimbusds.jwt.JWTClaimsSet claims = jwtUtils.validateToken(token);
            Integer userId = Integer.valueOf(claims.getSubject());
            Long memberId = userId.longValue();
            log.info("Extracted memberId {} from WebSocket handshake token", memberId);
            return Mono.just(memberId);
        } catch (Exception e) {
            log.error("Invalid token in WebSocket handshake", e);
            return Mono.error(new RuntimeException("Invalid or expired token: " + e.getMessage()));
        }
    }

    private static String resolveTokenFromQueryParam(WebSocketSession session) {
        String query = session.getHandshakeInfo().getUri().getQuery();
        if (query != null && query.contains("token=")) {
            System.out.println("from query param 1111");
            int start = query.indexOf("token=") + 6;
            int amp = query.indexOf('&', start);
            String raw = amp >= 0 ? query.substring(start, amp) : query.substring(start);
            if (!raw.isEmpty()) {
                return raw;
            }
        }
        return null;
    }

    private Mono<Void> handleMessage(WebSocketSession session, Long memberId, String messageText) {
        try {
            JsonNode json = JsonUtils.fromJson(messageText, JsonNode.class);
            String type = json.get("type").asText();

            return switch (type) {
                case "JOIN_GROUP" -> handleJoinGroup(session, memberId, json);
                case "SEND_MESSAGE" -> handleSendMessage(session, memberId, json);
                case "LEAVE_GROUP" -> handleLeaveGroup(session, json);
                default -> {
                    log.warn("Unknown message type: {}", type);
                    yield sendError(session, "Unknown message type: " + type);
                }
            };
        } catch (Exception e) {
            log.error("Error parsing message: {}", messageText, e);
            return sendError(session, "Invalid message format");
        }
    }

    private Mono<Void> handleJoinGroup(WebSocketSession session, Long memberId, JsonNode json) {
        Long groupId = json.get("groupId").asLong();

        return chatGroupMemberRepository.findByGroupId(groupId)
                .filter(member -> memberId.equals(member.getMemberId()))
                .hasElements()
                .flatMap(isMember -> {
                    if (!isMember) {
                        return sendError(session, "You are not a member of this group");
                    }

                    groupToSessions.computeIfAbsent(groupId, k -> ConcurrentHashMap.newKeySet())
                            .add(session);

                    log.info("Member {} joined group {}", memberId, groupId);

                    return sendMessage(session, JsonUtils.toJson(Map.of(
                            "type", "JOINED_GROUP",
                            "groupId", groupId,
                            "message", "Successfully joined group"
                    )));
                });
    }

    private Mono<Void> handleSendMessage(WebSocketSession session, Long memberId, JsonNode json) {
        Long groupId = json.get("groupId").asLong();
        String content = json.get("content").asText();
        String messageType = json.has("messageType") ? json.get("messageType").asText() : "TEXT";
        String metadata = json.has("metadata") ? json.get("metadata").toString() : null;
        String chatType = json.has("chatType") ? json.get("chatType").asText() : null;

        return chatService.sendMessage(groupId, memberId, content, messageType, metadata, chatType)
                .flatMap(savedMessage -> userProfileRepository
                        .findDisplayInfoByUserId(savedMessage.getSenderMemberId().intValue()) // N + 1 query cho nay ne, co thoi gian thi sua
                        .defaultIfEmpty(UserDisplayInfo.builder()
                                .userId(savedMessage.getSenderMemberId().intValue())
                                .build())
                        .flatMap(senderInfo -> broadcastMessage(groupId, savedMessage, senderInfo)))
                .onErrorResume(error -> {
                    log.error("Error sending message", error);
                    return sendError(session, "Failed to send message: " + error.getMessage());
                });
    }

    private Mono<Void> handleLeaveGroup(WebSocketSession session, JsonNode json) {
        Long groupId = json.get("groupId").asLong();
        Set<WebSocketSession> sessions = groupToSessions.get(groupId);
        if (sessions != null) {
            sessions.remove(session);
            log.info("Session {} left group {}", session.getId(), groupId);
        }
        return sendMessage(session, JsonUtils.toJson(Map.of(
                "type", "LEFT_GROUP",
                "groupId", groupId,
                "message", "Successfully left group"
        )));
    }

    private Mono<Void> broadcastMessage(Long groupId, ChatMessage message, UserDisplayInfo senderInfo) {
        Set<WebSocketSession> sessions = groupToSessions.get(groupId);
        if (sessions == null || sessions.isEmpty()) {
            return Mono.empty();
        }
        Object metadataPayload = "";
        if (message.getMetadata() != null && !message.getMetadata().isBlank()) {
            metadataPayload = JsonUtils.fromJson(message.getMetadata(), Object.class);
        }

        Map<String, Object> payload = new HashMap<>();
        payload.put("id", message.getId());
        payload.put("groupId", message.getGroupId());
        payload.put("senderMemberId", message.getSenderMemberId());
        payload.put("senderFullName", senderInfo.getFullName());
        payload.put("senderAvatarUrl", senderInfo.getAvatarUrl());
        payload.put("content", message.getContent());
        payload.put("messageType", message.getMessageType());
        payload.put("metadata", metadataPayload);
        payload.put("createdAt", message.getCreatedAt());

        String eventJson = JsonUtils.toJson(Map.of(
                "type", "MESSAGE_CREATED",
                "payload", payload
        ));

        return Mono.fromRunnable(() -> {
            sessions.forEach(session -> {
                if (session.isOpen()) {
                    session.send(Mono.just(session.textMessage(eventJson)))
                            .subscribe(null, error -> log.error("Error broadcasting to session {}", session.getId(), error));
                }
            });
        }).then();
    }

    private Mono<Void> sendMessage(WebSocketSession session, String json) {
        return session.send(Mono.just(session.textMessage(json)));
    }

    private Mono<Void> sendError(WebSocketSession session, String errorMessage) {
        String errorJson = JsonUtils.toJson(Map.of(
                "type", "ERROR",
                "message", errorMessage
        ));
        return sendMessage(session, errorJson);
    }

    private void cleanupSession(WebSocketSession session, Long memberId) {
        sessionToMember.remove(session.getId());

        groupToSessions.values().forEach(sessions -> sessions.remove(session));

        groupToSessions.entrySet().removeIf(entry -> entry.getValue().isEmpty());
    }
}
