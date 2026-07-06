package com.service.backend.mentorship.dao;

import com.service.backend.shared.entity.Skill;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Collection;

@Repository
public interface SkillR2dbcRepository extends ReactiveCrudRepository<Skill, Integer> {

    @Query("SELECT * FROM skills WHERE LOWER(name) = LOWER(:name)")
    Mono<Skill> findByNameIgnoreCase(String name);

    @Query("SELECT * FROM skills WHERE id IN (:ids)")
    Flux<Skill> findByIds(Collection<Integer> ids);

    @Query("SELECT * FROM skills " +
            "WHERE (:search IS NULL OR LOWER(name) LIKE LOWER(CONCAT('%', :search, '%'))) " +
            "ORDER BY LOWER(name) ASC LIMIT :limit OFFSET :offset")
    Flux<Skill> search(String search, int limit, int offset);

    @Query("SELECT COUNT(*) FROM skills " +
            "WHERE (:search IS NULL OR LOWER(name) LIKE LOWER(CONCAT('%', :search, '%')))")
    Mono<Long> countSearch(String search);
}
