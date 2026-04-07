package com.service.backend.forum.dao;

import com.service.backend.forum.entity.ForumTopic;
import org.springframework.data.r2dbc.repository.Modifying;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface ForumTopicRepository extends R2dbcRepository<ForumTopic, Integer> {
    
    /**
     * Find forum topic by title
     */
    Mono<ForumTopic> findByTitle(String title);

    /**
     * Find forum topics by category id with pagination
     */
    @Query("SELECT * FROM forum_topics WHERE category_id = :categoryId ORDER BY created_at DESC LIMIT :limit OFFSET :offset")
    Flux<ForumTopic> findByCategoryIdWithPagination(
            @Param("categoryId") Integer categoryId,
            @Param("limit") int limit,
            @Param("offset") long offset
    );

    /**
     * Find forum topics by organization id
     */
    Flux<ForumTopic> findByOrganizationId(Integer organizationId);

    /**
     * Find forum topics by organization id with pagination
     */
    @Query("SELECT * FROM forum_topics WHERE organization_id = :organizationId ORDER BY created_at DESC LIMIT :limit OFFSET :offset")
    Flux<ForumTopic> findByOrganizationIdWithPagination(
            @Param("organizationId") Integer organizationId,
            @Param("limit") int limit,
            @Param("offset") long offset
    );

    /**
     * Increment view count on forum topic
     */
    @Modifying
    @Query("UPDATE forum_topics SET view_count = view_count + 1 WHERE id = :id")
    Mono<Integer> incrementViewCount(@Param("id") Integer id);

    /**
     * Count topics by category id
     */
    @Query("SELECT COUNT(*) FROM forum_topics WHERE category_id = :categoryId")
    Mono<Long> countByCategoryId(@Param("categoryId") Integer categoryId);

    /**
     * Count topics by organization id
     */
    @Query("SELECT COUNT(*) FROM forum_topics WHERE organization_id = :organizationId")
    Mono<Long> countByOrganizationId(@Param("organizationId") Integer organizationId);

    // ========== STATISTICS QUERIES ==========

    /**
     * Count topics created today
     */
    @Query("SELECT COUNT(*) FROM forum_topics WHERE DATE(created_at) = CURRENT_DATE")
    Mono<Long> countTopicsCreatedToday();

    /**
     * Find ghost topics: created more than 7 days ago with 0 posts.
     * Returns up to 20 ghost topics ordered by oldest first.
     */
    @Query("SELECT ft.* FROM forum_topics ft " +
           "LEFT JOIN forum_posts fp ON ft.id = fp.topic_id " +
           "WHERE ft.created_at < CURRENT_TIMESTAMP - INTERVAL '7 days' " +
           "GROUP BY ft.id " +
           "HAVING COUNT(fp.id) = 0 " +
           "ORDER BY ft.created_at ASC " +
           "LIMIT 20")
    Flux<ForumTopic> findGhostTopics();

    /**
     * Find the category_id with the most posts across its topics
     */
    @Query("SELECT ft.category_id FROM forum_topics ft " +
           "JOIN forum_posts fp ON ft.id = fp.topic_id " +
           "WHERE fp.is_banned = false " +
           "GROUP BY ft.category_id " +
           "ORDER BY COUNT(fp.id) DESC " +
           "LIMIT 1")
    Mono<Integer> findCategoryIdWithMostPosts();

    /**
     * Count topics created in a given month/year
     */
    @Query("SELECT COUNT(*) FROM forum_topics " +
           "WHERE EXTRACT(MONTH FROM created_at) = :month " +
           "AND EXTRACT(YEAR FROM created_at) = :year")
    Mono<Long> countTopicsInMonth(@Param("month") int month, @Param("year") int year);
}

