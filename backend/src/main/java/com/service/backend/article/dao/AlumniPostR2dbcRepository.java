package com.service.backend.article.dao;

import com.service.backend.shared.entity.AlumniPost;
import org.springframework.data.r2dbc.repository.Modifying;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface AlumniPostR2dbcRepository extends R2dbcRepository<AlumniPost, Integer> {

    @Query("SELECT * FROM alumni_posts WHERE organization_id = :organizationId ORDER BY created_at DESC LIMIT :limit OFFSET :offset")
    Flux<AlumniPost> findByOrganizationIdWithPagination(Integer organizationId, int limit, int offset);

    @Query("SELECT * FROM alumni_posts WHERE author_member_id = :authorMemberId AND organization_id = :organizationId AND is_hidden = false ORDER BY created_at DESC LIMIT :limit OFFSET :offset")
    Flux<AlumniPost> findPublishedByAuthorMemberIdAndOrganizationId(Integer authorMemberId, Integer organizationId, int limit, int offset);

    @Query("SELECT COUNT(*) FROM alumni_posts WHERE author_member_id = :authorMemberId AND organization_id = :organizationId AND is_hidden = false")
    Mono<Long> countPublishedByAuthorMemberIdAndOrganizationId(Integer authorMemberId, Integer organizationId);

    @Query("SELECT COUNT(*) FROM alumni_posts WHERE organization_id = :organizationId")
    Mono<Long> countByOrganizationId(Integer organizationId);

    @Query("SELECT * FROM alumni_posts ORDER BY created_at DESC LIMIT :limit OFFSET :offset")
    Flux<AlumniPost> findAllWithPagination(int limit, int offset);

    @Query("SELECT * FROM alumni_posts WHERE LOWER(title) LIKE LOWER(CONCAT('%', :keyword, '%')) ORDER BY created_at DESC LIMIT :limit OFFSET :offset")
    Flux<AlumniPost> searchAllByTitleWithPagination(String keyword, int limit, int offset);

    @Query("SELECT COUNT(*) FROM alumni_posts WHERE LOWER(title) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    Mono<Long> countAllSearchByTitle(String keyword);

    @Query("SELECT * FROM alumni_posts WHERE organization_id = :organizationId AND is_hidden = false ORDER BY created_at DESC LIMIT :limit OFFSET :offset")
    Flux<AlumniPost> findPublishedByOrganizationId(Integer organizationId, int limit, int offset);

    @Query("SELECT COUNT(*) FROM alumni_posts WHERE organization_id = :organizationId AND is_hidden = false")
    Mono<Long> countPublishedByOrganizationId(Integer organizationId);

    @Query("SELECT * FROM alumni_posts WHERE organization_id = :organizationId AND (LOWER(title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(content) LIKE LOWER(CONCAT('%', :keyword, '%'))) AND is_hidden = false ORDER BY created_at DESC LIMIT :limit OFFSET :offset")
    Flux<AlumniPost> searchAlumniPosts(Integer organizationId, String keyword, int limit, int offset);

    @Query("SELECT COUNT(*) FROM alumni_posts WHERE organization_id = :organizationId AND (LOWER(title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(content) LIKE LOWER(CONCAT('%', :keyword, '%'))) AND is_hidden = false")
    Mono<Long> countSearchAlumniPosts(Integer organizationId, String keyword);

    Mono<AlumniPost> findBySlug(String slug);

    @Modifying
    @Query("UPDATE alumni_posts SET is_hidden = false, updated_at = CURRENT_TIMESTAMP WHERE id = :id")
    Mono<Integer> publishAlumniPost(Integer id);

    @Modifying
    @Query("UPDATE alumni_posts SET is_hidden = true, updated_at = CURRENT_TIMESTAMP WHERE id = :id")
    Mono<Integer> hideAlumniPost(Integer id);

    @Query("SELECT COUNT(*) FROM alumni_posts WHERE created_at >= :since")
    Mono<Long> countSince(java.time.LocalDateTime since);
}
