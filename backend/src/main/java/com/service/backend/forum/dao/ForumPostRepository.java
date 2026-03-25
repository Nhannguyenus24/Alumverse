package com.service.backend.forum.dao;

import org.springframework.data.r2dbc.repository.Modifying;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.service.backend.forum.entity.ForumPost;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface ForumPostRepository extends R2dbcRepository<ForumPost, Integer> {
    
    /**
     * Find forum posts by topic id with pagination
     */
    @Query("SELECT * FROM forum_posts WHERE topic_id = :topicId AND is_banned = false ORDER BY created_at ASC LIMIT :limit OFFSET :offset")
    Flux<ForumPost> findByTopicIdWithPagination(
            @Param("topicId") Integer topicId,
            @Param("limit") int limit,
            @Param("offset") long offset
    );

    /**
     * Find all forum posts by topic id (including banned)
     */
    Flux<ForumPost> findByTopicId(Integer topicId);

    /**
     * Find forum posts by author member id
     */
    Flux<ForumPost> findByAuthorMemberId(Integer authorMemberId);

    /**
     * Find replies to a specific post
     */
    @Query("SELECT * FROM forum_posts WHERE answer_to_post_id = :postId AND is_banned = false ORDER BY created_at ASC")
    Flux<ForumPost> findRepliesByPostId(@Param("postId") Integer postId);

    /**
     * Ban a forum post
     */
    @Modifying
    @Query("UPDATE forum_posts SET is_banned = true, updated_at = CURRENT_TIMESTAMP WHERE id = :id")
    Mono<Integer> banPost(@Param("id") Integer id);

    /**
     * Unban a forum post
     */
    @Modifying
    @Query("UPDATE forum_posts SET is_banned = false, updated_at = CURRENT_TIMESTAMP WHERE id = :id")
    Mono<Integer> unbanPost(@Param("id") Integer id);

    /**
     * Count posts by topic id (excluding banned)
     */
    @Query("SELECT COUNT(*) FROM forum_posts WHERE topic_id = :topicId AND is_banned = false")
    Mono<Long> countByTopicId(@Param("topicId") Integer topicId);

    /**
     * Count total posts by topic id (including banned)
     */
    @Query("SELECT COUNT(*) FROM forum_posts WHERE topic_id = :topicId")
    Mono<Long> countAllByTopicId(@Param("topicId") Integer topicId);

    /**
     * Update post content
     */
    @Modifying
    @Query("UPDATE forum_posts SET content = :content, updated_at = CURRENT_TIMESTAMP WHERE id = :id")
    Mono<Integer> updatePostContent(@Param("id") Integer id, @Param("content") String content);

    /**
     * Set answer to another post
     */
    @Modifying
    @Query("UPDATE forum_posts SET answer_to_post_id = :answerToPostId, updated_at = CURRENT_TIMESTAMP WHERE id = :id")
    Mono<Integer> setAnswerToPost(@Param("id") Integer id, @Param("answerToPostId") Integer answerToPostId);

    /**
     * Clear all answer references to a specific post (set to NULL)
     * This prevents foreign key constraint violation when deleting a post
     */
    @Modifying
    @Query("UPDATE forum_posts SET answer_to_post_id = NULL, updated_at = CURRENT_TIMESTAMP WHERE answer_to_post_id = :postId")
    Mono<Integer> clearAnswerReferences(@Param("postId") Integer postId);
}
