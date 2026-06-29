package com.service.backend.event.dao;

import lombok.RequiredArgsConstructor;
import org.springframework.r2dbc.core.DatabaseClient;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Mono;

/**
 * Looks up the display profile (name / email / avatar) of a ticket holder so the check-in screen
 * can show <em>who</em> the ticket belongs to and staff can verify the person in front of them.
 *
 * <p>{@code event_tickets.member_id} references a {@code users.id} (via
 * {@code organization_members.user_id}), so the lookup is a direct read on {@code users}.</p>
 */
@Repository
@RequiredArgsConstructor
public class AttendeeLookupRepository {

    private final DatabaseClient databaseClient;

    public Mono<AttendeeProfile> findByUserId(Integer userId) {
        if (userId == null) return Mono.empty();
        return databaseClient
                .sql("SELECT id, full_name, email, avatar_url FROM users WHERE id = :id")
                .bind("id", userId)
                .map((row, meta) -> new AttendeeProfile(
                        row.get("id", Integer.class),
                        row.get("full_name", String.class),
                        row.get("email", String.class),
                        row.get("avatar_url", String.class)))
                .first();
    }

    public record AttendeeProfile(Integer userId, String fullName, String email, String avatarUrl) {}
}
