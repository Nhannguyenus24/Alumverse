package com.service.backend.forum.dao;

import com.service.backend.shared.entity.ForumTopicSubscription;

import java.time.LocalDateTime;
import java.util.Collection;

import org.springframework.data.r2dbc.repository.Modifying;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface ForumTopicSubscriptionRepository extends R2dbcRepository<ForumTopicSubscription, Integer> {
    
    /**
     * Find subscription by topic id and member id
     */
    Mono<ForumTopicSubscription> findByTopicIdAndMemberId(Integer topicId, Integer memberId);

    /**
     * Delete subscription by topic id and member id
     */
    Mono<Void> deleteByTopicIdAndMemberId(Integer topicId, Integer memberId);

    /**
     * Delete all subscriptions for a topic (used when cascade-deleting a topic).
     */
    @Query("DELETE FROM forum_topic_subscriptions WHERE topic_id = :topicId")
    Mono<Void> deleteByTopicId(@Param("topicId") Integer topicId);

    /**
     * Update last read at for a subscription
     */
    @Modifying
    @Query("UPDATE forum_topic_subscriptions SET last_read_at = :lastReadAt WHERE topic_id = :topicId AND member_id = :memberId")
    Mono<Integer> updateLastReadAt(Integer topicId, Integer memberId, LocalDateTime lastReadAt);

    /**
     * Update last notified at for a batch of subscriptions
     */
    @Modifying
    @Query("UPDATE forum_topic_subscriptions SET last_notified_at = :lastNotifiedAt WHERE id IN (:ids)")
    Mono<Integer> updateLastNotifiedAtBatch(Collection<Integer> ids, LocalDateTime lastNotifiedAt);

    /**
     * Full scan: find all subscriptions that have new posts since last read and last notified.
     * COALESCE falls back to s.created_at so new subscribers (null last_read_at / last_notified_at)
     * are included correctly without matching posts that predate their subscription.
     * Used as fallback when the in-memory cache is empty (e.g. after a server restart).
     */
    @Query("SELECT DISTINCT s.id, s.topic_id, s.member_id, s.last_read_at, s.last_notified_at, s.created_at " +
           "FROM forum_topic_subscriptions s " +
           "JOIN forum_posts p ON s.topic_id = p.topic_id " +
           "WHERE p.created_at > COALESCE(s.last_read_at, s.created_at) " +
           "AND p.created_at > COALESCE(s.last_notified_at, s.created_at) " +
           "AND p.author_member_id != s.member_id")
    Flux<ForumTopicSubscription> findSubscriptionsWithNewPosts();

    /**
     * Optimized scan: same conditions but scoped to the topic IDs that are known
     * to have recent activity (supplied from the in-memory cache).
     */
    @Query("SELECT DISTINCT s.id, s.topic_id, s.member_id, s.last_read_at, s.last_notified_at, s.created_at " +
           "FROM forum_topic_subscriptions s " +
           "JOIN forum_posts p ON s.topic_id = p.topic_id " +
           "WHERE s.topic_id IN (:topicIds) " +
           "AND p.created_at > COALESCE(s.last_read_at, s.created_at) " +
           "AND p.created_at > COALESCE(s.last_notified_at, s.created_at) " +
           "AND p.author_member_id != s.member_id")
    Flux<ForumTopicSubscription> findSubscriptionsWithNewPostsInTopics(Collection<Integer> topicIds);
}
