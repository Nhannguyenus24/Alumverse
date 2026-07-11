package com.service.backend.shared.service;

import java.time.Duration;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.codec.ServerSentEvent;
import org.springframework.stereotype.Service;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Sinks;

/**
 * In-memory registry of active Server-Sent Events connections.
 *
 * <p>The app runs on Spring WebFlux, so SSE is exposed as a {@link Flux} of
 * {@link ServerSentEvent} rather than the servlet-only {@code SseEmitter}. Each
 * browser tab opens one connection ({@link #connect}); a single user may have
 * several (multiple tabs). Events are pushed with {@link #sendToUser} (verification
 * / ban / new-message) or {@link #sendToOrganization} (feature toggles).
 *
 * <p>State is per-instance and non-durable: on a restart clients simply reconnect.
 * If the backend is ever scaled to more than one instance this must move to a
 * shared broker (Redis pub/sub), mirroring the single-instance caveat already
 * documented on the chat WebSocket handler.
 */
@Service
public class SseService {

    private static final Logger log = LoggerFactory.getLogger(SseService.class);

    /** How often to push a heartbeat comment so proxies/browsers keep the stream open. */
    private static final Duration HEARTBEAT_INTERVAL = Duration.ofSeconds(25);

    private record Connection(Long userId, Integer organizationId,
            Sinks.Many<ServerSentEvent<Object>> sink) {}

    /** connectionId -> connection. */
    private final Map<String, Connection> connections = new ConcurrentHashMap<>();

    /**
     * Secondary indexes so a push is O(target's open connections) instead of a scan
     * over every connection: userId -> connectionIds, organizationId -> connectionIds.
     * A null organizationId (e.g. an ADMIN with no org in the JWT) is not indexed and
     * therefore never receives an org broadcast.
     */
    private final Map<Long, Set<String>> connectionsByUser = new ConcurrentHashMap<>();
    private final Map<Integer, Set<String>> connectionsByOrg = new ConcurrentHashMap<>();

    /**
     * Register a new SSE connection for the given user and return the event stream.
     * The connection is removed automatically when the client disconnects.
     */
    public Flux<ServerSentEvent<Object>> connect(Long userId, Integer organizationId) {
        String connectionId = UUID.randomUUID().toString();
        Sinks.Many<ServerSentEvent<Object>> sink = Sinks.many().multicast().onBackpressureBuffer();
        connections.put(connectionId, new Connection(userId, organizationId, sink));
        connectionsByUser.computeIfAbsent(userId, k -> ConcurrentHashMap.newKeySet()).add(connectionId);
        if (organizationId != null) {
            connectionsByOrg.computeIfAbsent(organizationId, k -> ConcurrentHashMap.newKeySet()).add(connectionId);
        }
        log.info("SSE connected: connectionId={}, userId={}, orgId={}, total={}",
                connectionId, userId, organizationId, connections.size());

        ServerSentEvent<Object> connected = ServerSentEvent.<Object>builder()
                .event("connected")
                .data(Map.of("connectionId", connectionId))
                .build();

        Flux<ServerSentEvent<Object>> heartbeat = Flux.interval(HEARTBEAT_INTERVAL)
                .map(tick -> ServerSentEvent.<Object>builder().comment("ping").build());

        return Flux.merge(Flux.just(connected), sink.asFlux(), heartbeat)
                .doFinally(signal -> {
                    connections.remove(connectionId);
                    removeFromIndex(connectionsByUser, userId, connectionId);
                    removeFromIndex(connectionsByOrg, organizationId, connectionId);
                    log.info("SSE disconnected: connectionId={}, userId={}, reason={}, total={}",
                            connectionId, userId, signal, connections.size());
                });
    }

    /** Push an event to every open connection belonging to the given user. */
    public void sendToUser(Long userId, String event, Object data) {
        if (userId == null) return;
        broadcast(connectionsByUser.get(userId), event, data);
    }

    /** Push an event to every open connection whose user belongs to the given organization. */
    public void sendToOrganization(Integer organizationId, String event, Object data) {
        if (organizationId == null) return;
        broadcast(connectionsByOrg.get(organizationId), event, data);
    }

    private void broadcast(Set<String> connectionIds, String event, Object data) {
        if (connectionIds == null || connectionIds.isEmpty()) return;
        ServerSentEvent<Object> sse = build(event, data);
        connectionIds.forEach(connectionId -> {
            Connection connection = connections.get(connectionId);
            if (connection != null) {
                emit(connection, event, sse);
            }
        });
    }

    private <K> void removeFromIndex(Map<K, Set<String>> index, K key, String connectionId) {
        if (key == null) return;
        index.computeIfPresent(key, (k, ids) -> {
            ids.remove(connectionId);
            return ids.isEmpty() ? null : ids;
        });
    }

    private ServerSentEvent<Object> build(String event, Object data) {
        return ServerSentEvent.<Object>builder()
                .id(UUID.randomUUID().toString())
                .event(event)
                .data(data)
                .build();
    }

    private void emit(Connection connection, String event, ServerSentEvent<Object> sse) {
        // sendToUser/sendToOrganization can be invoked concurrently from different reactive
        // threads, so serialize emission with a bounded busy-loop instead of the non-thread-safe
        // tryEmitNext fast path (which would return FAIL_NON_SERIALIZED under contention).
        try {
            connection.sink().emitNext(sse, EMIT_FAILURE_HANDLER);
        } catch (RuntimeException ex) {
            log.warn("Failed to emit SSE event '{}' to userId={}: {}",
                    event, connection.userId(), ex.getMessage());
        }
    }

    private static final Sinks.EmitFailureHandler EMIT_FAILURE_HANDLER =
            Sinks.EmitFailureHandler.busyLooping(Duration.ofMillis(100));
}
