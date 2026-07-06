package com.service.backend.article.dao;

import com.service.backend.shared.entity.Achievement;
import com.service.backend.article.dto.AchievementDetailDTO;
import com.service.backend.shared.enums.Status;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface AchievementR2dbcRepository extends ReactiveCrudRepository<Achievement, Integer> {

    @Query("SELECT * FROM achievements ORDER BY awarded_date DESC LIMIT :limit OFFSET :offset")
    Flux<Achievement> findAllWithPagination(int limit, int offset);

    @Query("SELECT * FROM achievements WHERE LOWER(title) LIKE LOWER(CONCAT('%', :keyword, '%')) ORDER BY awarded_date DESC LIMIT :limit OFFSET :offset")
    Flux<Achievement> searchAllByTitleWithPagination(String keyword, int limit, int offset);

    @Query("SELECT COUNT(*) FROM achievements WHERE LOWER(title) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    Mono<Long> countAllSearchByTitle(String keyword);

    @Query("SELECT COUNT(*) FROM achievements")
    Mono<Long> countAll();

    @Query("SELECT * FROM achievements WHERE member_id = :memberId ORDER BY awarded_date DESC LIMIT :limit OFFSET :offset")
    Flux<Achievement> findByMemberId(Integer memberId, int limit, int offset);

    @Query("SELECT COUNT(*) FROM achievements WHERE member_id = :memberId")
    Mono<Long> countByMemberId(Integer memberId);

    @Query("SELECT COUNT(*) FROM achievements WHERE status = :status")
    Mono<Long> countByStatus(Status status);

    @Query("SELECT a.id, a.member_id, a.title, a.description, a.image_url, a.url, a.awarded_date, a.topic, a.status, " +
           "u.full_name as member_name, u.avatar_url as member_avatar, " +
           "mp.current_job_title as member_job_title, mp.current_company as member_company " +
           "FROM achievements a " +
           "LEFT JOIN users u ON a.member_id = u.id " +
           "LEFT JOIN mentor_profiles mp ON a.member_id = mp.member_id " +
           "WHERE a.status = :status " +
           "ORDER BY a.awarded_date DESC LIMIT :limit OFFSET :offset")
    Flux<AchievementDetailDTO> findDetailsByStatus(Status status, int limit, int offset);

    @Query("SELECT * FROM achievements WHERE (LOWER(title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(description) LIKE LOWER(CONCAT('%', :keyword, '%'))) ORDER BY awarded_date DESC LIMIT :limit OFFSET :offset")
    Flux<Achievement> searchAchievements(String keyword, int limit, int offset);

    @Query("SELECT COUNT(*) FROM achievements WHERE (LOWER(title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(description) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Mono<Long> countSearchAchievements(String keyword);

    @Query("SELECT a.* FROM achievements a " +
           "JOIN organization_members om ON a.member_id = om.user_id " +
           "WHERE om.organization_id = :organizationId " +
           "ORDER BY a.awarded_date DESC LIMIT :limit OFFSET :offset")
    Flux<Achievement> findByOrganizationIdWithPagination(Integer organizationId, int limit, int offset);

    @Query("SELECT COUNT(*) FROM achievements a " +
           "JOIN organization_members om ON a.member_id = om.user_id " +
           "WHERE om.organization_id = :organizationId")
    Mono<Long> countByOrganizationId(Integer organizationId);

    @Query("SELECT a.* FROM achievements a " +
           "JOIN organization_members om ON a.member_id = om.user_id " +
           "WHERE om.organization_id = :organizationId " +
           "AND LOWER(a.title) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "ORDER BY a.awarded_date DESC LIMIT :limit OFFSET :offset")
    Flux<Achievement> searchByOrganizationAndTitle(Integer organizationId, String keyword, int limit, int offset);

    @Query("SELECT COUNT(*) FROM achievements a " +
           "JOIN organization_members om ON a.member_id = om.user_id " +
           "WHERE om.organization_id = :organizationId " +
           "AND LOWER(a.title) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    Mono<Long> countSearchByOrganizationAndTitle(Integer organizationId, String keyword);

    @Query("UPDATE achievements SET status = :status WHERE id = :id")
    Mono<Integer> updateStatus(Integer id, Status status);
}
