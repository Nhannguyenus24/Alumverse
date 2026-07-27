package com.service.backend.forum.dao;

import com.service.backend.shared.dto.IdCountDTO;
import com.service.backend.shared.entity.ForumTopic;
import org.springframework.data.r2dbc.repository.Modifying;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Collection;

@Repository
public interface ForumTopicRepository extends R2dbcRepository<ForumTopic, Integer> {
    
    /**
     * Find forum topic by title
     */
    Mono<ForumTopic> findByTitle(String title);


    /**
     * Find all forum topics in a category (any status). Used when cascade-deleting a category.
     */
    Flux<ForumTopic> findByCategoryId(Integer categoryId);

    /**
     * Find ACTIVE forum topics by category id with pagination and keyword (public listing).
     * PENDING (awaiting approval) and INACTIVE (hidden) topics are excluded.
     */
    @Query("SELECT * FROM forum_topics WHERE category_id = :categoryId AND status = 'ACTIVE' " +
           "AND (:keyword IS NULL OR LOWER(title) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
           "ORDER BY created_at DESC LIMIT :limit OFFSET :offset")
    Flux<ForumTopic> findActiveByCategoryIdWithPagination(
            @Param("categoryId") Integer categoryId,
            @Param("keyword") String keyword,
            @Param("limit") int limit,
            @Param("offset") long offset
    );

    /**
     * Find ACTIVE forum topics by category id with pagination and keyword, ordered by most viewed.
     * PENDING (awaiting approval) and INACTIVE (hidden) topics are excluded. Ties broken by newest.
     */
    @Query("SELECT * FROM forum_topics WHERE category_id = :categoryId AND status = 'ACTIVE' " +
           "AND (:keyword IS NULL OR LOWER(title) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
           "ORDER BY view_count DESC, created_at DESC LIMIT :limit OFFSET :offset")
    Flux<ForumTopic> findActiveByCategoryIdOrderByViewCount(
            @Param("categoryId") Integer categoryId,
            @Param("keyword") String keyword,
            @Param("limit") int limit,
            @Param("offset") long offset
    );

    /**
     * Count ACTIVE topics by category id with keyword (public listing).
     */
    @Query("SELECT COUNT(*) FROM forum_topics WHERE category_id = :categoryId AND status = 'ACTIVE' " +
           "AND (:keyword IS NULL OR LOWER(title) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Mono<Long> countActiveByCategoryId(
            @Param("categoryId") Integer categoryId,
            @Param("keyword") String keyword
    );

    /**
     * Find forum topics by organization id with pagination and keyword
     */
    @Query("SELECT * FROM forum_topics WHERE organization_id = :organizationId " +
           "AND (:keyword IS NULL OR LOWER(title) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
           "ORDER BY created_at DESC LIMIT :limit OFFSET :offset")
    Flux<ForumTopic> findByOrganizationIdWithPagination(
            @Param("organizationId") Integer organizationId,
            @Param("keyword") String keyword,
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
     * Count topics by category id with keyword
     */
    @Query("SELECT COUNT(*) FROM forum_topics WHERE category_id = :categoryId " +
           "AND (:keyword IS NULL OR LOWER(title) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Mono<Long> countByCategoryId(
            @Param("categoryId") Integer categoryId,
            @Param("keyword") String keyword
    );

    /**
     * Count ACTIVE topics by category id for public category statistics.
     */
    @Query("SELECT COUNT(*) FROM forum_topics WHERE category_id = :categoryId AND status = 'ACTIVE'")
    Mono<Long> countActiveByCategoryId(@Param("categoryId") Integer categoryId);

    /**
     * Count distinct discussion participants in a category.
     * Participants include topic creators and post authors under topics in the category.
     */
    @Query("SELECT COUNT(DISTINCT member_id) FROM (" +
           "SELECT ft.created_by_member_id AS member_id FROM forum_topics ft " +
           "WHERE ft.category_id = :categoryId AND ft.created_by_member_id IS NOT NULL " +
           "UNION " +
           "SELECT fp.author_member_id AS member_id FROM forum_posts fp " +
           "JOIN forum_topics ft2 ON fp.topic_id = ft2.id " +
           "WHERE ft2.category_id = :categoryId AND fp.is_banned = false AND fp.author_member_id IS NOT NULL" +
           ") participants")
    Mono<Long> countDistinctParticipantsByCategoryId(@Param("categoryId") Integer categoryId);

    /**
     * Count distinct participants in ACTIVE topics only for public category statistics.
     */
    @Query("SELECT COUNT(DISTINCT member_id) FROM (" +
           "SELECT ft.created_by_member_id AS member_id FROM forum_topics ft " +
           "WHERE ft.category_id = :categoryId AND ft.status = 'ACTIVE' AND ft.created_by_member_id IS NOT NULL " +
           "UNION " +
           "SELECT fp.author_member_id AS member_id FROM forum_posts fp " +
           "JOIN forum_topics ft2 ON fp.topic_id = ft2.id " +
           "WHERE ft2.category_id = :categoryId AND ft2.status = 'ACTIVE' AND fp.is_banned = false AND fp.author_member_id IS NOT NULL" +
           ") participants")
    Mono<Long> countActiveDistinctParticipantsByCategoryId(@Param("categoryId") Integer categoryId);

    /**
     * Batch variant of {@link #countByCategoryId} with no keyword: topic counts per category
     * for a set of categories in a single query.
     */
    @Query("SELECT category_id as id, COUNT(*) as count FROM forum_topics " +
           "WHERE category_id IN (:categoryIds) GROUP BY category_id")
    Flux<IdCountDTO> countByCategoryIds(@Param("categoryIds") Collection<Integer> categoryIds);

    /**
     * Batch count of ACTIVE topics per category for public category statistics.
     */
    @Query("SELECT category_id as id, COUNT(*) as count FROM forum_topics " +
           "WHERE status = 'ACTIVE' AND category_id IN (:categoryIds) GROUP BY category_id")
    Flux<IdCountDTO> countActiveByCategoryIds(@Param("categoryIds") Collection<Integer> categoryIds);

    /**
     * Batch variant of {@link #countDistinctParticipantsByCategoryId}: distinct participant
     * counts per category for a set of categories in a single query.
     */
    @Query("SELECT category_id as id, COUNT(DISTINCT member_id) as count FROM (" +
           "SELECT ft.category_id AS category_id, ft.created_by_member_id AS member_id FROM forum_topics ft " +
           "WHERE ft.category_id IN (:categoryIds) AND ft.created_by_member_id IS NOT NULL " +
           "UNION " +
           "SELECT ft2.category_id AS category_id, fp.author_member_id AS member_id FROM forum_posts fp " +
           "JOIN forum_topics ft2 ON fp.topic_id = ft2.id " +
           "WHERE ft2.category_id IN (:categoryIds) AND fp.is_banned = false AND fp.author_member_id IS NOT NULL" +
           ") participants GROUP BY category_id")
    Flux<IdCountDTO> countDistinctParticipantsByCategoryIds(@Param("categoryIds") Collection<Integer> categoryIds);

    /**
     * Batch count of distinct participants in ACTIVE topics only for public category statistics.
     */
    @Query("SELECT category_id as id, COUNT(DISTINCT member_id) as count FROM (" +
           "SELECT ft.category_id AS category_id, ft.created_by_member_id AS member_id FROM forum_topics ft " +
           "WHERE ft.status = 'ACTIVE' AND ft.category_id IN (:categoryIds) AND ft.created_by_member_id IS NOT NULL " +
           "UNION " +
           "SELECT ft2.category_id AS category_id, fp.author_member_id AS member_id FROM forum_posts fp " +
           "JOIN forum_topics ft2 ON fp.topic_id = ft2.id " +
           "WHERE ft2.status = 'ACTIVE' AND ft2.category_id IN (:categoryIds) AND fp.is_banned = false AND fp.author_member_id IS NOT NULL" +
           ") participants GROUP BY category_id")
    Flux<IdCountDTO> countActiveDistinctParticipantsByCategoryIds(@Param("categoryIds") Collection<Integer> categoryIds);

    /**
     * Count topics by organization id with keyword
     */
    @Query("SELECT COUNT(*) FROM forum_topics WHERE organization_id = :organizationId " +
           "AND (:keyword IS NULL OR LOWER(title) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Mono<Long> countByOrganizationId(
            @Param("organizationId") Integer organizationId,
            @Param("keyword") String keyword
    );

    // ========== STATISTICS QUERIES ==========

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

    @Query("SELECT * FROM forum_topics " +
           "WHERE (:keyword IS NULL OR LOWER(title) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
           "ORDER BY created_at DESC LIMIT :limit OFFSET :offset")
    Flux<ForumTopic> findAllWithPagination(
            @Param("keyword") String keyword,
            @Param("limit") int limit,
            @Param("offset") long offset);

    @Query("SELECT COUNT(*) FROM forum_topics " +
           "WHERE (:keyword IS NULL OR LOWER(title) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Mono<Long> countAll(@Param("keyword") String keyword);
    @Query("""
        SELECT
            COUNT(*) AS total_topics,
            SUM(CASE WHEN DATE(created_at) = CURRENT_DATE THEN 1 ELSE 0 END) AS new_topics_today
        FROM forum_topics
    """)
    Mono<com.service.backend.forum.dto.ForumTopicStatsProjection> getAggregatedTopicStats();
}
