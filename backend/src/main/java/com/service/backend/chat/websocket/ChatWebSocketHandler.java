package com.service.backend.chat.websocket;

import com.fasterxml.jackson.databind.JsonNode;
import com.service.backend.chat.entity.ChatMessage;
import com.service.backend.chat.repository.ChatGroupMemberRepository;
import com.service.backend.chat.service.ChatService;
import com.service.backend.shared.utils.JsonUtils;
import com.service.backend.shared.utils.JwtUtils;
import com.service.backend.shared.utils.SecurityUtils;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.socket.WebSocketHandler;
import org.springframework.web.reactive.socket.WebSocketMessage;
import org.springframework.web.reactive.socket.WebSocketSession;
import reactor.core.publisher.Mono;

import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * WebSocket handler for real-time chat functionality.
 * Handles JOIN_GROUP, SEND_MESSAGE, LEAVE_GROUP events.
 */
@Slf4j
@Component
public class ChatWebSocketHandler implements WebSocketHandler {

    private final ChatService chatService;
    private final ChatGroupMemberRepository chatGroupMemberRepository;
    private final JwtUtils jwtUtils;

    // Map: sessionId -> memberId
    private final Map<String, Long> sessionToMember = new ConcurrentHashMap<>();

    // Map: groupId -> Set of WebSocketSession
    private final Map<Long, Set<WebSocketSession>> groupToSessions = new ConcurrentHashMap<>();

    public ChatWebSocketHandler(ChatService chatService, ChatGroupMemberRepository chatGroupMemberRepository, JwtUtils jwtUtils) {
        this.chatService = chatService;
        this.chatGroupMemberRepository = chatGroupMemberRepository;
        this.jwtUtils = jwtUtils;
    }

    @Override
    public Mono<Void> handle(WebSocketSession session) {
        // Try to get member ID from security context first
        Mono<Long> memberIdMono = SecurityUtils.getCurrentUserId()
                .onErrorResume(error -> {
                    // If security context is not available, try to extract token from query parameter
                    log.debug("Security context not available, trying query parameter: {}", error.getMessage());
                    return extractMemberIdFromToken(session);
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
        String token = null;

        // Try query parameter first: ws://localhost:8080/ws/chat?token=...
        String query = session.getHandshakeInfo().getUri().getQuery();
        if (query != null && query.contains("token=")) {
            String tokenParam = query.substring(query.indexOf("token=") + 6);
            int endIndex = tokenParam.indexOf('&');
            if (endIndex > 0) {
                token = tokenParam.substring(0, endIndex);
            } else {
                token = tokenParam;
            }
        }

        // Fallback to Authorization header
        if (token == null) {
            String authHeader = session.getHandshakeInfo().getHeaders().getFirst("Authorization");
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                token = authHeader.substring(7);
            }
        }

        if (token == null) {
            return Mono.error(new RuntimeException("No authentication token found in query parameter or header"));
        }

        try {
            Integer userId = jwtUtils.getUserIdFromToken(token);
            Long memberId = userId.longValue();
            log.debug("Extracted memberId {} from token in query parameter/header", memberId);
            return Mono.just(memberId);
        } catch (Exception e) {
            log.error("Invalid token in query parameter/header", e);
            return Mono.error(new RuntimeException("Invalid or expired token: " + e.getMessage()));
        }
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

        return chatService.sendMessage(groupId, memberId, content, messageType, metadata)
                .flatMap(savedMessage -> {
                    return broadcastMessage(groupId, savedMessage);
                })
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

    private Mono<Void> broadcastMessage(Long groupId, ChatMessage message) {
        Set<WebSocketSession> sessions = groupToSessions.get(groupId);
        if (sessions == null || sessions.isEmpty()) {
            return Mono.empty();
        }

        String eventJson = JsonUtils.toJson(Map.of(
                "type", "MESSAGE_CREATED",
                "payload", Map.of(
                        "id", message.getId(),
                        "groupId", message.getGroupId(),
                        "senderMemberId", message.getSenderMemberId(),
                        "content", message.getContent(),
                        "messageType", message.getMessageType(),
                        "metadata", message.getMetadata() != null ? message.getMetadata() : "",
                        "createdAt", message.getCreatedAt()
                )
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
