package com.service.backend.chat.websocket;

import com.fasterxml.jackson.databind.JsonNode;
import com.service.backend.shared.entity.ChatMessage;
import com.service.backend.shared.entity.ChatGroupMember;
import com.service.backend.chat.dao.ChatGroupMemberRepository;
import com.service.backend.chat.service.ChatService;
import com.service.backend.shared.dao.UserDisplayInfo;
import com.service.backend.user.dao.UserProfileRepository;
import com.service.backend.user.service.NotificationService;
import com.service.backend.shared.service.SseService;
import com.service.backend.shared.utils.JsonUtils;
import com.service.backend.shared.utils.JwtUtils;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Gauge;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.reactive.socket.WebSocketHandler;
import org.springframework.web.reactive.socket.WebSocketMessage;
import org.springframework.web.reactive.socket.WebSocketSession;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;
import com.service.backend.shared.exception.ApplicationException;
import com.service.backend.shared.enums.ErrorCode;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;

import java.time.Duration;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
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
    private final NotificationService notificationService;
    private final JwtUtils jwtUtils;
    private final SseService sseService;

    // Sentinel memberId used by the client to represent an "@all" (mention everyone) token.
    private static final String ALL_MENTION_SENTINEL = "__all__";
    // Keep the notification body short; a mention notification is a teaser, not the full message.
    private static final int MENTION_PREVIEW_MAX_LENGTH = 120;

    // Map: sessionId -> memberId
    private final Map<String, Long> sessionToMember = new ConcurrentHashMap<>();

    // Map: groupId -> Set of WebSocketSession
    private final Map<Long, Set<WebSocketSession>> groupToSessions = new ConcurrentHashMap<>();

    // Cache sender display info (name/avatar) to avoid a DB round-trip on every single message.
    // Display info changes rarely, so a short TTL is an acceptable staleness trade-off.
    private final Cache<Integer, UserDisplayInfo> senderInfoCache = Caffeine.newBuilder()
            .maximumSize(10_000)
            .expireAfterWrite(Duration.ofMinutes(5))
            .build();

    public ChatWebSocketHandler(
            ChatService chatService,
            ChatGroupMemberRepository chatGroupMemberRepository,
            UserProfileRepository userProfileRepository,
            NotificationService notificationService,
            JwtUtils jwtUtils,
            SseService sseService,
            MeterRegistry meterRegistry) {
        this.chatService = chatService;
        this.chatGroupMemberRepository = chatGroupMemberRepository;
        this.userProfileRepository = userProfileRepository;
        this.notificationService = notificationService;
        this.jwtUtils = jwtUtils;
        this.sseService = sseService;

        // Real-time gauge of currently connected WebSocket sessions and active chat groups.
        Gauge.builder("chat.websocket.active_sessions", sessionToMember, Map::size)
                .description("Number of currently connected chat WebSocket sessions")
                .register(meterRegistry);
        Gauge.builder("chat.websocket.active_groups", groupToSessions, Map::size)
                .description("Number of chat groups with at least one active subscriber")
                .register(meterRegistry);
    }

    @Override
    public Mono<Void> handle(WebSocketSession session) {

        // Do not use SecurityUtils.getCurrentUserId() because in websocket there is no Security context holder. 
        Mono<Long> memberIdMono = extractMemberIdFromToken(session)
        .onErrorResume(error -> {
            //System.out.println("Error on extracting memberId from token: " + error.getMessage());
            log.error("Error on extracting memberId from token: {}", error.getMessage());
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
                                cleanupSession(session);
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
            Integer userId = Integer.parseInt(claims.getSubject());
            Long memberId = userId.longValue();
            return Mono.just(memberId);
        } catch (Exception e) {
            log.error("Invalid token in WebSocket handshake", e);
            return Mono.error(new RuntimeException("Invalid or expired token: " + e.getMessage()));
        }
    }

    private static String resolveTokenFromQueryParam(WebSocketSession session) {
        String query = session.getHandshakeInfo().getUri().getQuery();
        if (query != null && query.contains("token=")) {
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
                case "TYPING" -> handleTyping(session, memberId, json);
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
                    int senderId = savedMessage.getSenderMemberId().intValue();
                    UserDisplayInfo cached = senderInfoCache.getIfPresent(senderId);
                    Mono<UserDisplayInfo> senderInfoMono = cached != null
                            ? Mono.just(cached)
                            : userProfileRepository.findDisplayInfoByUserId(senderId)
                                    .defaultIfEmpty(UserDisplayInfo.builder().userId(senderId).build())
                                    .doOnNext(info -> senderInfoCache.put(senderId, info));
                    return senderInfoMono
                            .flatMap(senderInfo -> {
                                // Notify @mentioned members in the background: fire-and-forget on a
                                // separate scheduler so resolving/persisting mention notifications
                                // (which may hit the DB for @all) never delays message delivery.
                                notifyMentionedMembers(groupId, memberId, savedMessage, senderInfo)
                                        .subscribeOn(Schedulers.boundedElastic())
                                        .subscribe(null, error -> log.warn(
                                                "Failed to notify mentioned members for message {}",
                                                savedMessage.getId(), error));
                                return broadcastMessage(groupId, savedMessage, senderInfo)
                                        .then(notifyNewMessageViaSse(groupId, memberId, savedMessage, senderInfo));
                            });
                })
                .onErrorResume(error -> {
                    log.error("Error sending message", error);
                    return sendError(session, "Failed to send message: " + error.getMessage());
                });
    }

    /**
     * Relay a lightweight "is typing" signal to every other live session in the group.
     * Purely ephemeral: nothing is persisted and no SSE fan-out happens, so it stays cheap
     * even under rapid keystrokes. The sender's own session is excluded.
     */
    private Mono<Void> handleTyping(WebSocketSession session, Long memberId, JsonNode json) {
        Long groupId = json.get("groupId").asLong();
        boolean isTyping = json.has("isTyping") && json.get("isTyping").asBoolean();

        Set<WebSocketSession> sessions = groupToSessions.get(groupId);
        if (sessions == null || sessions.isEmpty()) {
            return Mono.empty();
        }

        int senderId = memberId.intValue();
        UserDisplayInfo cached = senderInfoCache.getIfPresent(senderId);
        Mono<UserDisplayInfo> senderInfoMono = cached != null
                ? Mono.just(cached)
                : userProfileRepository.findDisplayInfoByUserId(senderId)
                        .defaultIfEmpty(UserDisplayInfo.builder().userId(senderId).build())
                        .doOnNext(info -> senderInfoCache.put(senderId, info));

        return senderInfoMono.flatMap(senderInfo -> {
            Map<String, Object> payload = new HashMap<>();
            payload.put("groupId", groupId);
            payload.put("memberId", memberId);
            payload.put("senderName", senderInfo.getFullName());
            payload.put("isTyping", isTyping);

            String eventJson = JsonUtils.toJson(Map.of(
                    "type", "TYPING",
                    "payload", payload
            ));

            return Mono.fromRunnable(() -> sessions.forEach(peer -> {
                if (peer != session && peer.isOpen()) {
                    peer.send(Mono.just(peer.textMessage(eventJson)))
                            .subscribe(null, error -> log.error("Error sending typing signal to session {}", peer.getId(), error));
                }
            })).then();
        });
    }

    /**
     * Notify every group member except the sender over their global SSE stream so the
     * message button badge updates even when the recipient is not viewing this group.
     */
    private Mono<Void> notifyNewMessageViaSse(Long groupId, Long senderMemberId,
            ChatMessage message, UserDisplayInfo senderInfo) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("groupId", groupId);
        payload.put("messageId", message.getId());
        payload.put("senderId", message.getSenderMemberId());
        payload.put("senderName", senderInfo.getFullName());
        payload.put("preview", message.getContent());
        payload.put("createdAt", message.getCreatedAt());

        return chatGroupMemberRepository.findByGroupId(groupId)
                .filter(member -> !senderMemberId.equals(member.getMemberId()))
                .doOnNext(member -> sseService.sendToUser(member.getMemberId(), "new-message", payload))
                .then();
    }

    /**
     * Send an in-app + push notification to every member @mentioned in the message.
     * The sender is never notified about their own mention, and "@all" is expanded to
     * every other group member. Best-effort: any failure is logged and swallowed so it
     * can never affect message delivery.
     */
    private Mono<Void> notifyMentionedMembers(Long groupId, Long senderMemberId,
            ChatMessage message, UserDisplayInfo senderInfo) {
        MentionTargets targets = parseMentionTargets(message.getMetadata());
        if (!targets.mentionAll() && targets.memberIds().isEmpty()) {
            return Mono.empty();
        }

        Flux<Long> recipients = targets.mentionAll()
                ? chatGroupMemberRepository.findByGroupId(groupId).map(ChatGroupMember::getMemberId)
                : Flux.fromIterable(targets.memberIds());

        String senderName = StringUtils.hasText(senderInfo.getFullName())
                ? senderInfo.getFullName().trim()
                : "Một thành viên";
        String title = senderName + " đã nhắc đến bạn";
        String body = buildMentionPreview(message.getContent());
        // Deep-link straight to the conversation the mention happened in. ChatPage reads
        // the chatId query param and opens that conversation on load.
        String link = "/chat?chatId=" + groupId;

        return recipients
                .filter(recipientId -> recipientId != null && !senderMemberId.equals(recipientId))
                .distinct()
                .doOnNext(recipientId ->
                        notificationService.createNotificationAsync(recipientId.intValue(), title, body, link))
                .then();
    }

    /**
     * Extract mention targets from the message metadata JSON ({@code {"mentions":[{"memberId":..,"name":..}]}}).
     * A memberId equal to the {@code "__all__"} sentinel expands to the whole group; numeric ids are
     * concrete recipients. Anything unparseable yields empty targets.
     */
    private MentionTargets parseMentionTargets(String metadata) {
        // ChatService persists the literal string "null" when no metadata was provided.
        if (metadata == null || metadata.isBlank() || "null".equals(metadata)) {
            return new MentionTargets(false, List.of());
        }
        try {
            JsonNode root = JsonUtils.fromJson(metadata, JsonNode.class);
            JsonNode mentions = root == null ? null : root.get("mentions");
            if (mentions == null || !mentions.isArray()) {
                return new MentionTargets(false, List.of());
            }
            boolean mentionAll = false;
            List<Long> memberIds = new ArrayList<>();
            for (JsonNode mention : mentions) {
                JsonNode idNode = mention.get("memberId");
                if (idNode == null) {
                    continue;
                }
                if (idNode.isNumber()) {
                    memberIds.add(idNode.asLong());
                    continue;
                }
                String raw = idNode.asText();
                if (ALL_MENTION_SENTINEL.equals(raw)) {
                    mentionAll = true;
                } else {
                    try {
                        memberIds.add(Long.parseLong(raw));
                    } catch (NumberFormatException ignored) {
                        // Non-numeric, non-sentinel id — skip it.
                    }
                }
            }
            return new MentionTargets(mentionAll, memberIds);
        } catch (Exception e) {
            log.warn("Failed to parse mention metadata: {}", metadata, e);
            return new MentionTargets(false, List.of());
        }
    }

    private static String buildMentionPreview(String content) {
        if (!StringUtils.hasText(content)) {
            return "";
        }
        String trimmed = content.trim();
        return trimmed.length() <= MENTION_PREVIEW_MAX_LENGTH
                ? trimmed
                : trimmed.substring(0, MENTION_PREVIEW_MAX_LENGTH) + "…";
    }

    /** Parsed mention recipients: either the whole group ({@code mentionAll}) and/or explicit member ids. */
    private record MentionTargets(boolean mentionAll, List<Long> memberIds) {
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

        return Mono.fromRunnable(() -> sessions.forEach(session -> {
            if (session.isOpen()) {
                session.send(Mono.just(session.textMessage(eventJson)))
                        .subscribe(null, error -> log.error("Error broadcasting to session {}", session.getId(), error));
            }
        })).then();
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

    private void cleanupSession(WebSocketSession session) {
        sessionToMember.remove(session.getId());

        groupToSessions.values().forEach(sessions -> sessions.remove(session));

        groupToSessions.entrySet().removeIf(entry -> entry.getValue().isEmpty());
    }
}
