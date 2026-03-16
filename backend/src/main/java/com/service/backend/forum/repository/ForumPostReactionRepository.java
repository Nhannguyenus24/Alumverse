package com.service.backend.forum.repository;

import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.service.backend.forum.entities.ForumPostReaction;

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
    @Query("SELECT COUNT(*) FROM forum_post_reactions WHERE post_id = :postId")
    Mono<Long> countReactionsByPostId(@Param("postId") Integer postId);
    
    /**
     * Delete reaction by post id and member id
     */
    Mono<Void> deleteByPostIdAndMemberId(Integer postId, Integer memberId);
}
