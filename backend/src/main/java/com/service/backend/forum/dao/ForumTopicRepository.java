package com.service.backend.forum.dao;

import com.service.backend.forum.entities.ForumTopic;
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
}
