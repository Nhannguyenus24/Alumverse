package com.service.backend.forum.dao;

import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.service.backend.shared.entity.ForumPost;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface ForumPostRepository extends R2dbcRepository<ForumPost, Integer> {
    
    /**
     * Find forum posts by topic id with pagination
     */
    @Query("SELECT * FROM forum_posts WHERE topic_id = :topicId AND is_banned = false AND is_hidden = false ORDER BY created_at ASC LIMIT :limit OFFSET :offset")
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
    @Query("SELECT COUNT(*) FROM forum_posts WHERE topic_id = :topicId AND is_banned = false AND is_hidden = false")
    Mono<Long> countByTopicId(@Param("topicId") Integer topicId);

    /**
     * Count total posts by topic id (including banned)
     */
    Mono<Long> countAllByTopicId(Integer topicId);

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
     * Find all forum posts with pagination (admin moderation list).
     */
    @Query("SELECT * FROM forum_posts WHERE (:keyword IS NULL OR LOWER(content) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
           "ORDER BY created_at DESC LIMIT :limit OFFSET :offset")
    Flux<ForumPost> findAllPostsWithPagination(
            @Param("keyword") String keyword,
            @Param("limit") int limit,
            @Param("offset") long offset
    );

    /**
     * Count all forum posts with keyword
     */
    @Query("SELECT COUNT(*) FROM forum_posts WHERE (:keyword IS NULL OR LOWER(content) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Mono<Long> countAllPostsWithKeyword(@Param("keyword") String keyword);

    /**
     * Count all banned forum posts
     */
    Mono<Long> countByIsBannedTrue();

    // ========== STATISTICS QUERIES ==========

    /**
     * Count posts created today
     */
    @Query("SELECT COUNT(*) FROM forum_posts WHERE DATE(created_at) = CURRENT_DATE")
    Mono<Long> countPostsCreatedToday();

    /**
     * Find the topic_id with the most posts (returns single topic_id)
     */
    @Query("SELECT topic_id FROM forum_posts WHERE is_banned = false GROUP BY topic_id ORDER BY COUNT(*) DESC LIMIT 1")
    Mono<Integer> findTopicIdWithMostPosts();

    /**
     * Count posts for a specific topic
     */
    Mono<Long> countByTopicIdAndIsBannedFalse(Integer topicId);

    /**
     * Count posts belonging to topics under a specific category
     */
    @Query("SELECT COUNT(*) FROM forum_posts fp " +
           "JOIN forum_topics ft ON fp.topic_id = ft.id " +
           "WHERE ft.category_id = :categoryId AND fp.is_banned = false")
    Mono<Long> countPostsByCategoryId(@Param("categoryId") Integer categoryId);

    /**
     * Find top 10 contributor member IDs for a given month and year, ordered by post count DESC.
     * Returns author_member_id values.
     */
    @Query("SELECT author_member_id FROM forum_posts " +
           "WHERE EXTRACT(MONTH FROM created_at) = :month " +
           "AND EXTRACT(YEAR FROM created_at) = :year " +
           "AND is_banned = false " +
           "GROUP BY author_member_id " +
           "ORDER BY COUNT(*) DESC " +
           "LIMIT 10")
    Flux<Integer> findTopContributorMemberIds(@Param("month") int month, @Param("year") int year);

    /**
     * Count posts by a specific author in a given month/year
     */
    @Query("SELECT COUNT(*) FROM forum_posts " +
           "WHERE author_member_id = :authorMemberId " +
           "AND EXTRACT(MONTH FROM created_at) = :month " +
           "AND EXTRACT(YEAR FROM created_at) = :year " +
           "AND is_banned = false")
    Mono<Long> countPostsByAuthorInMonth(
            @Param("authorMemberId") Integer authorMemberId,
            @Param("month") int month,
            @Param("year") int year);

    /**
     * Count distinct active users (who posted) in a given month/year
     */
    @Query("SELECT COUNT(DISTINCT author_member_id) FROM forum_posts " +
           "WHERE EXTRACT(MONTH FROM created_at) = :month " +
           "AND EXTRACT(YEAR FROM created_at) = :year " +
           "AND is_banned = false")
    Mono<Long> countDistinctActiveUsersInMonth(@Param("month") int month, @Param("year") int year);

    /**
     * Count total posts in a given month/year
     */
    @Query("SELECT COUNT(*) FROM forum_posts " +
           "WHERE EXTRACT(MONTH FROM created_at) = :month " +
           "AND EXTRACT(YEAR FROM created_at) = :year")
    Mono<Long> countPostsInMonth(@Param("month") int month, @Param("year") int year);

    /**
     * Count distinct active forum users in a specific organization
     * (users who have posted at least once, where those users belong to the given organization)
     */
    @Query("SELECT COUNT(DISTINCT fp.author_member_id) FROM forum_posts fp " +
           "JOIN organization_members om ON fp.author_member_id = om.user_id " +
           "WHERE om.organization_id = :organizationId " +
           "AND fp.is_banned = false")
    Mono<Long> countActiveForumUsersByOrganization(@Param("organizationId") Integer organizationId);

    @Query("SELECT fp.* FROM forum_posts fp " +
           "JOIN forum_topics ft ON fp.topic_id = ft.id " +
           "WHERE ft.organization_id = :organizationId AND fp.is_banned = true " +
           "ORDER BY fp.updated_at DESC LIMIT :limit OFFSET :offset")
    Flux<ForumPost> findBannedPostsByOrganizationWithPagination(@Param("organizationId") Integer organizationId,
                                                                 @Param("limit") int limit,
                                                                 @Param("offset") int offset);

    @Query("SELECT COUNT(*) FROM forum_posts fp " +
           "JOIN forum_topics ft ON fp.topic_id = ft.id " +
           "WHERE ft.organization_id = :organizationId AND fp.is_banned = true")
    Mono<Long> countBannedPostsByOrganization(@Param("organizationId") Integer organizationId);

    @Query("SELECT fp.* FROM forum_posts fp " +
           "JOIN forum_topics ft ON fp.topic_id = ft.id " +
           "WHERE ft.organization_id = :organizationId " +
           "AND (:keyword IS NULL OR LOWER(fp.content) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
           "ORDER BY fp.created_at DESC LIMIT :limit OFFSET :offset")
    Flux<ForumPost> findAllPostsByOrganizationWithPagination(@Param("organizationId") Integer organizationId,
                                                              @Param("keyword") String keyword,
                                                              @Param("limit") int limit,
                                                              @Param("offset") int offset);

    @Query("SELECT COUNT(*) FROM forum_posts fp " +
           "JOIN forum_topics ft ON fp.topic_id = ft.id " +
           "WHERE ft.organization_id = :organizationId " +
           "AND (:keyword IS NULL OR LOWER(fp.content) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Mono<Long> countAllPostsByOrganization(@Param("organizationId") Integer organizationId,
                                           @Param("keyword") String keyword);

    @Query("SELECT fp.* FROM forum_posts fp " +
           "JOIN forum_topics ft ON fp.topic_id = ft.id " +
           "WHERE ft.organization_id = :organizationId " +
           "AND DATE(fp.created_at) = CURRENT_DATE - INTERVAL '1 day' AND fp.is_banned = false " +
           "ORDER BY fp.created_at DESC LIMIT :limit OFFSET :offset")
    Flux<ForumPost> findPostsCreatedYesterdayByOrganizationWithPagination(@Param("organizationId") Integer organizationId,
                                                                           @Param("limit") int limit,
                                                                           @Param("offset") int offset);

    @Query("SELECT COUNT(*) FROM forum_posts fp " +
           "JOIN forum_topics ft ON fp.topic_id = ft.id " +
           "WHERE ft.organization_id = :organizationId " +
           "AND DATE(fp.created_at) = CURRENT_DATE - INTERVAL '1 day' AND fp.is_banned = false")
    Mono<Long> countPostsCreatedYesterdayByOrganization(@Param("organizationId") Integer organizationId);

}

