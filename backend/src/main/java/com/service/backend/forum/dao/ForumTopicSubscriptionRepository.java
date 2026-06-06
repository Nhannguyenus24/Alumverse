package com.service.backend.forum.dao;

import com.service.backend.shared.entity.ForumTopicSubscription;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.stereotype.Repository;
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
     * Count subscriptions by topic id
     */
    Mono<Long> countByTopicId(Integer topicId);
}
