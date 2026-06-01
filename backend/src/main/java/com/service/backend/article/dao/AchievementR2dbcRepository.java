package com.service.backend.article.dao;

import com.service.backend.shared.entity.Achievement;
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

    @Query("SELECT COUNT(*) FROM achievements")
    Mono<Long> countAll();

    @Query("SELECT * FROM achievements WHERE member_id = :memberId ORDER BY awarded_date DESC LIMIT :limit OFFSET :offset")
    Flux<Achievement> findByMemberId(Integer memberId, int limit, int offset);

    @Query("SELECT COUNT(*) FROM achievements WHERE member_id = :memberId")
    Mono<Long> countByMemberId(Integer memberId);

    @Query("SELECT * FROM achievements WHERE status = :status ORDER BY awarded_date DESC LIMIT :limit OFFSET :offset")
    Flux<Achievement> findByStatus(Status status, int limit, int offset);

    @Query("SELECT COUNT(*) FROM achievements WHERE status = :status")
    Mono<Long> countByStatus(Status status);

    @Query("SELECT * FROM achievements WHERE (LOWER(title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(description) LIKE LOWER(CONCAT('%', :keyword, '%'))) ORDER BY awarded_date DESC LIMIT :limit OFFSET :offset")
    Flux<Achievement> searchAchievements(String keyword, int limit, int offset);

    @Query("SELECT COUNT(*) FROM achievements WHERE (LOWER(title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(description) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Mono<Long> countSearchAchievements(String keyword);
}
