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
     * Find forum posts created yesterday
     */
    @Query("SELECT * FROM forum_posts WHERE DATE(created_at) = CURRENT_DATE - INTERVAL '1 day' AND is_banned = false ORDER BY created_at DESC")
    Flux<ForumPost> findPostsCreatedYesterday();

    /**
     * Find forum posts created yesterday with pagination
     */
    @Query("SELECT * FROM forum_posts WHERE DATE(created_at) = CURRENT_DATE - INTERVAL '1 day' AND is_banned = false ORDER BY created_at DESC LIMIT :limit OFFSET :offset")
    Flux<ForumPost> findPostsCreatedYesterdayWithPagination(
            @Param("limit") int limit,
            @Param("offset") long offset
    );

    /**
     * Count posts created yesterday
     */
    @Query("SELECT COUNT(*) FROM forum_posts WHERE DATE(created_at) = CURRENT_DATE - INTERVAL '1 day' AND is_banned = false")
    Mono<Long> countPostsCreatedYesterday();

    /**
     * Find all banned forum posts with pagination
     */
    @Query("SELECT * FROM forum_posts WHERE is_banned = true ORDER BY updated_at DESC LIMIT :limit OFFSET :offset")
    Flux<ForumPost> findAllBannedPostsWithPagination(
            @Param("limit") int limit,
            @Param("offset") long offset
    );

    /**
     * Count all banned forum posts
     */
    @Query("SELECT COUNT(*) FROM forum_posts WHERE is_banned = true")
    Mono<Long> countBannedPosts();

}
