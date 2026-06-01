package com.service.backend.forum.dao;

import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.service.backend.shared.entity.ForumPostReaction;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface ForumPostReactionRepository extends R2dbcRepository<ForumPostReaction, Integer> {
    
    /**
     * Find reaction by post id and member id
     */
    Mono<ForumPostReaction> findByPostIdAndMemberId(Integer postId, Integer memberId);
    
    /**
     * Find all reactions for a post
     */
    Flux<ForumPostReaction> findByPostId(Integer postId);
    
    /**
     * Count likes (reactions) for a post
     */
    Mono<Long> countByPostId(Integer postId);
    
    /**
     * Delete reaction by post id and member id
     */
    Mono<Void> deleteByPostIdAndMemberId(Integer postId, Integer memberId);
    
    /**
     * Delete all reactions for a post
     */
    Mono<Void> deleteByPostId(Integer postId);
    
    /**
     * Find all post IDs that a member has reacted to in a specific topic
     * Optimizes N+1 query problem by fetching all likes in one query
     */
    @Query("""
        SELECT DISTINCT fpr.post_id FROM forum_post_reactions fpr
        INNER JOIN forum_posts fp ON fpr.post_id = fp.id
        WHERE fp.topic_id = :topicId AND fpr.member_id = :memberId
    """)
    Flux<Integer> findLikedPostIdsByTopicAndMember(
            @Param("topicId") Integer topicId,
            @Param("memberId") Integer memberId
    );
}
