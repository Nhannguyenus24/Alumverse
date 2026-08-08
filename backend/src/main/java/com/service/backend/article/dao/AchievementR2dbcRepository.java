package com.service.backend.article.dao;

import com.service.backend.shared.entity.Achievement;
import com.service.backend.article.dto.AchievementDetailDTO;
import com.service.backend.shared.enums.Status;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface AchievementR2dbcRepository extends R2dbcRepository<Achievement, Integer> {

    String PUBLIC_LIST_SELECT = "SELECT a.id, a.organization_id, a.member_id, a.title, a.description, "
            + "a.image_url, a.url, a.awarded_date, a.created_at, a.updated_at, a.topic, a.status, "
            + "u.full_name as member_name, u.avatar_url as member_avatar, "
            + "mp.current_job_title as member_job_title, mp.current_company as member_company "
            + "FROM achievements a "
            + "LEFT JOIN users u ON a.member_id = u.id "
            + "LEFT JOIN mentor_profiles mp ON a.member_id = mp.member_id ";

    /**
     * Legacy achievement topics map to more than one standardized topic (e.g. a stored 'award'
     * must still match both 'competition_award' and 'international_honor'). A CASE returning a
     * single value cannot express that, so each stored topic expands to an array of accepted
     * values and matches when it overlaps the requested set. Mirrors getArticleTopicCandidates()
     * in the frontend's articleListFilters.js.
     */
    String PUBLIC_TOPIC_MATCH = """
            (:topicsCsv = '' OR (
              CASE LOWER(REPLACE(COALESCE(a.topic, ''), '-', '_'))
                WHEN 'award' THEN ARRAY['award', 'competition_award', 'international_honor']
                WHEN 'achievement_scholarship' THEN ARRAY['achievement_scholarship', 'prestigious_scholarship']
                WHEN 'career_achievement' THEN ARRAY['career_achievement', 'career_milestone']
                WHEN 'science_research' THEN ARRAY['science_research', 'research_publication']
                WHEN 'international' THEN ARRAY['international', 'international_honor']
                ELSE ARRAY[LOWER(REPLACE(COALESCE(a.topic, ''), '-', '_'))]
              END
            ) && STRING_TO_ARRAY(:topicsCsv, ','))
            """;

    String PUBLIC_FILTER = """
            a.organization_id = :organizationId
              AND a.status = 'APPROVED'
              AND (:keyword = ''
                   OR POSITION(LOWER(:keyword) IN LOWER(COALESCE(a.title, ''))) > 0
                   OR POSITION(LOWER(:keyword) IN LOWER(COALESCE(a.description, ''))) > 0)
              AND """ + PUBLIC_TOPIC_MATCH + """
              AND (:fromDate = '' OR CAST(COALESCE(a.updated_at, a.created_at) AS date) >= CAST(NULLIF(:fromDate, '') AS date))
              AND (:toDate = '' OR CAST(COALESCE(a.updated_at, a.created_at) AS date) <= CAST(NULLIF(:toDate, '') AS date))
            """;

    /**
     * Two sort keys, selected by :sortBy — :direction only ever picks asc vs desc.
     *
     * 'updated' (the default) keys on the same column the cards display and the date filter uses,
     * matching what the client-side sort in articleListFilters.js did before this list moved to the
     * server; the honors pages use it. 'awarded' keys on when the honor was actually awarded, which
     * is what the home page showed before, and falls back to the timestamps because awarded_date is
     * nullable.
     *
     * NULLS LAST on every date branch: a row whose whole date fallback chain is NULL is genuinely
     * dateless and must sort last, matching the client-side sort in articleListFilters.js which
     * mapped a missing date to 0. Postgres defaults DESC to NULLS FIRST, so without this such a row
     * floats to the top and can even be picked as the featured hero. It is safe on the inactive
     * branches too: a CASE whose condition is false yields NULL for every row, so those terms tie
     * regardless of the null placement and the id tiebreakers (never NULL) still decide.
     *
     * Written as one text block on purpose: concatenating text blocks here silently drops the
     * whitespace at the seam and yields tokens like THENCOALESCE.
     */
    String PUBLIC_ORDER = """
            ORDER BY
              CASE WHEN :sortBy = 'awarded' AND :direction = 'oldest'
                   THEN COALESCE(a.awarded_date, CAST(COALESCE(a.updated_at, a.created_at) AS date)) END ASC NULLS LAST,
              CASE WHEN :sortBy = 'awarded' AND :direction = 'newest'
                   THEN COALESCE(a.awarded_date, CAST(COALESCE(a.updated_at, a.created_at) AS date)) END DESC NULLS LAST,
              CASE WHEN :sortBy <> 'awarded' AND :direction = 'oldest'
                   THEN COALESCE(a.updated_at, a.created_at) END ASC NULLS LAST,
              CASE WHEN :sortBy <> 'awarded' AND :direction = 'newest'
                   THEN COALESCE(a.updated_at, a.created_at) END DESC NULLS LAST,
              CASE WHEN :direction = 'oldest' THEN a.id END ASC NULLS LAST,
              CASE WHEN :direction = 'newest' THEN a.id END DESC NULLS LAST
            """;

    @Query(PUBLIC_LIST_SELECT + " WHERE " + PUBLIC_FILTER + PUBLIC_ORDER + " LIMIT 1")
    Mono<AchievementDetailDTO> findPublicFeatured(Integer organizationId, String keyword, String topicsCsv,
                                                  String fromDate, String toDate, String sortBy,
                                                  String direction);

    @Query(PUBLIC_LIST_SELECT + " WHERE " + PUBLIC_FILTER
            + " AND (:featuredId IS NULL OR a.id <> :featuredId) " + PUBLIC_ORDER
            + " LIMIT :limit OFFSET :offset")
    Flux<AchievementDetailDTO> findPublicPage(Integer organizationId, Integer featuredId, String keyword,
                                              String topicsCsv, String fromDate, String toDate,
                                              String sortBy, String direction, int limit, int offset);

    @Query("SELECT COUNT(*) FROM achievements a WHERE " + PUBLIC_FILTER
            + " AND (:featuredId IS NULL OR a.id <> :featuredId)")
    Mono<Long> countPublicPage(Integer organizationId, Integer featuredId, String keyword,
                               String topicsCsv, String fromDate, String toDate);

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

    @Query("SELECT * FROM achievements WHERE member_id = :memberId AND organization_id = :organizationId AND status = 'APPROVED' ORDER BY awarded_date DESC LIMIT :limit OFFSET :offset")
    Flux<Achievement> findApprovedByMemberIdAndOrganizationId(Integer memberId, Integer organizationId, int limit, int offset);

    @Query("SELECT COUNT(*) FROM achievements WHERE member_id = :memberId AND organization_id = :organizationId AND status = 'APPROVED'")
    Mono<Long> countApprovedByMemberIdAndOrganizationId(Integer memberId, Integer organizationId);

    @Query("SELECT COUNT(*) FROM achievements WHERE status = :status")
    Mono<Long> countByStatus(Status status);

    @Query("SELECT COUNT(*) FROM achievements WHERE status = :status AND organization_id = :organizationId")
    Mono<Long> countByStatusAndOrganizationId(Status status, Integer organizationId);

    @Query("SELECT a.id, a.organization_id, a.member_id, a.title, a.description, a.image_url, a.url, a.awarded_date, a.created_at, a.updated_at, a.topic, a.status, " +
           "u.full_name as member_name, u.avatar_url as member_avatar, " +
           "mp.current_job_title as member_job_title, mp.current_company as member_company " +
           "FROM achievements a " +
           "LEFT JOIN users u ON a.member_id = u.id " +
           "LEFT JOIN mentor_profiles mp ON a.member_id = mp.member_id " +
           "WHERE a.status = :status " +
           "ORDER BY a.awarded_date DESC LIMIT :limit OFFSET :offset")
    Flux<AchievementDetailDTO> findDetailsByStatus(Status status, int limit, int offset);

    @Query("SELECT a.id, a.organization_id, a.member_id, a.title, a.description, a.image_url, a.url, a.awarded_date, a.created_at, a.updated_at, a.topic, a.status, " +
           "u.full_name as member_name, u.avatar_url as member_avatar, " +
           "mp.current_job_title as member_job_title, mp.current_company as member_company " +
           "FROM achievements a " +
           "LEFT JOIN users u ON a.member_id = u.id " +
           "LEFT JOIN mentor_profiles mp ON a.member_id = mp.member_id " +
           "WHERE a.status = :status AND a.organization_id = :organizationId " +
           "ORDER BY a.awarded_date DESC LIMIT :limit OFFSET :offset")
    Flux<AchievementDetailDTO> findDetailsByStatusAndOrganizationId(Status status, Integer organizationId, int limit, int offset);

    @Query("SELECT * FROM achievements " +
           "WHERE organization_id = :organizationId " +
           "ORDER BY awarded_date DESC LIMIT :limit OFFSET :offset")
    Flux<Achievement> findByOrganizationIdWithPagination(Integer organizationId, int limit, int offset);

    @Query("SELECT COUNT(*) FROM achievements WHERE organization_id = :organizationId")
    Mono<Long> countByOrganizationId(Integer organizationId);

    @Query("SELECT * FROM achievements " +
           "WHERE organization_id = :organizationId " +
           "AND status = 'APPROVED' " +
           "AND LOWER(title) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "ORDER BY awarded_date DESC LIMIT :limit OFFSET :offset")
    Flux<Achievement> searchByOrganizationAndTitle(Integer organizationId, String keyword, int limit, int offset);

    @Query("SELECT COUNT(*) FROM achievements " +
           "WHERE organization_id = :organizationId " +
           "AND status = 'APPROVED' " +
           "AND LOWER(title) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    Mono<Long> countSearchByOrganizationAndTitle(Integer organizationId, String keyword);

    @Query("UPDATE achievements SET status = :status, updated_at = CURRENT_TIMESTAMP WHERE id = :id")
    Mono<Integer> updateStatus(Integer id, Status status);
}
