package com.service.backend.integration;

import com.service.backend.shared.utils.CacheNames;
import com.service.backend.shared.utils.CacheUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.r2dbc.core.DatabaseClient;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Executes the {@code @Query} SQL behind {@code GET /api/articles/achievements} against a real
 * Postgres. The service-level unit tests mock the repository, so the hand-written ORDER BY — the
 * part that has already shipped broken twice — is only ever exercised here.
 *
 * Everything is scoped to a throwaway organization so this class never disturbs rows other
 * integration tests rely on.
 */
class PublicAchievementListIntegrationTest extends BaseIntegrationTest {

    @Autowired
    private DatabaseClient databaseClient;

    @Autowired
    private CacheUtils cacheUtils;

    private static Integer organizationId;

    /** awarded 2024-04-01, no timestamps at all: dated under 'awarded', dateless under 'updated'. */
    private Integer awardedOnly;
    /** No awarded_date and no timestamps: dateless under BOTH sort keys. */
    private Integer fullyDateless;
    /** Stored with the legacy 'award' topic, which aliases to two standardized topics. */
    private Integer legacyAward;
    /** Newest updated_at. */
    private Integer newestUpdated;
    /** Oldest updated_at. */
    private Integer oldestUpdated;

    @BeforeEach
    void setUp() {
        if (organizationId == null) {
            organizationId = databaseClient.sql("""
                            INSERT INTO organizations (name, slug, status)
                            VALUES (:name, :slug, 'ACTIVE')
                            RETURNING id
                            """)
                    .bind("name", "Public achievement list org")
                    .bind("slug", "public-achievement-list-" + UUID.randomUUID())
                    .map((row, metadata) -> row.get("id", Integer.class))
                    .one()
                    .block();
        }

        databaseClient.sql("DELETE FROM achievements WHERE organization_id = :organizationId")
                .bind("organizationId", organizationId)
                .then()
                .block();
        cacheUtils.clear(CacheNames.ACHIEVEMENT).block();

        awardedOnly = insert("Awarded only", "student_honor",
                LocalDate.of(2024, 4, 1), null, null);
        fullyDateless = insert("Fully dateless", "student_honor",
                null, null, null);
        legacyAward = insert("Legacy award topic", "award",
                LocalDate.of(2024, 1, 1),
                LocalDateTime.of(2024, 6, 1, 10, 0), LocalDateTime.of(2024, 6, 1, 10, 0));
        newestUpdated = insert("Newest updated", "competition_award",
                LocalDate.of(2024, 2, 1),
                LocalDateTime.of(2024, 8, 1, 10, 0), LocalDateTime.of(2024, 7, 1, 10, 0));
        oldestUpdated = insert("Oldest updated", "career_milestone",
                LocalDate.of(2024, 3, 1),
                LocalDateTime.of(2024, 5, 1, 10, 0), LocalDateTime.of(2024, 5, 1, 10, 0));
    }

    /**
     * Pins the full ORDER BY for both sort keys and both directions, including the regression guard
     * that a row whose whole date fallback chain is NULL sorts LAST. Postgres defaults DESC to NULLS
     * FIRST, so without the explicit NULLS LAST a dateless row floats to the top of the list and is
     * even picked as the featured hero.
     */
    @Test
    void orderingFollowsSortKeyAndDirectionAndPutsDatelessRowsLast() {
        // sortBy=awarded keys on COALESCE(awarded_date, updated_at::date, created_at::date):
        // awardedOnly 04-01, oldestUpdated 03-01, newestUpdated 02-01, legacyAward 01-01, dateless NULL.
        assertOrder(Map.of("sortBy", "awarded", "direction", "newest"),
                awardedOnly, List.of(oldestUpdated, newestUpdated, legacyAward, fullyDateless));
        assertOrder(Map.of("sortBy", "awarded", "direction", "oldest"),
                legacyAward, List.of(newestUpdated, oldestUpdated, awardedOnly, fullyDateless));

        // sortBy=updated keys on COALESCE(updated_at, created_at): newestUpdated 08-01,
        // legacyAward 06-01, oldestUpdated 05-01, then awardedOnly and fullyDateless (both NULL,
        // broken by id in the requested direction).
        assertOrder(Map.of("sortBy", "updated", "direction", "newest"),
                newestUpdated, List.of(legacyAward, oldestUpdated, fullyDateless, awardedOnly));
        assertOrder(Map.of("sortBy", "updated", "direction", "oldest"),
                oldestUpdated, List.of(legacyAward, newestUpdated, awardedOnly, fullyDateless));

        // Default sortBy is 'updated' and default direction is 'newest'.
        assertOrder(Map.of(), newestUpdated,
                List.of(legacyAward, oldestUpdated, fullyDateless, awardedOnly));
    }

    /**
     * A stored legacy topic maps to more than one standardized topic, so a row stored as 'award'
     * must be found by BOTH 'competition_award' and 'international_honor' — while a row genuinely
     * stored as 'competition_award' must NOT be found by 'international_honor'.
     */
    @Test
    @SuppressWarnings("unchecked")
    void legacyTopicAliasingMatchesEveryStandardizedTopicItExpandsTo() {
        Map<String, Object> byCompetitionAward = get(Map.of("topics", "competition_award"));
        assertThat(((Map<String, Object>) byCompetitionAward.get("featured")).get("id"))
                .isEqualTo(newestUpdated);
        assertThat((List<Map<String, Object>>) byCompetitionAward.get("items"))
                .extracting(item -> item.get("id"))
                .containsExactly(legacyAward);
        assertThat(byCompetitionAward.get("totalItem")).isEqualTo(1);

        Map<String, Object> byInternationalHonor = get(Map.of("topics", "international_honor"));
        assertThat(((Map<String, Object>) byInternationalHonor.get("featured")).get("id"))
                .isEqualTo(legacyAward);
        assertThat((List<?>) byInternationalHonor.get("items")).isEmpty();
        assertThat(byInternationalHonor.get("totalItem")).isEqualTo(0);

        Map<String, Object> byUnrelatedTopic = get(Map.of("topics", "achievement_hall_of_fame"));
        assertThat(byUnrelatedTopic.get("featured")).isNull();
        assertThat((List<?>) byUnrelatedTopic.get("items")).isEmpty();
        assertThat(byUnrelatedTopic.get("totalItem")).isEqualTo(0);
    }

    /**
     * The featured row is hoisted out of {@code items} and out of {@code totalItem}, and paging
     * walks the remainder with offset = page * limit. Page 1 is what regressed silently before:
     * nothing else in the suite requests it.
     */
    @Test
    @SuppressWarnings("unchecked")
    void featuredIsExcludedFromItemsAndTotalWhilePagingWalksTheRemainder() {
        Map<String, Object> firstPage = get(Map.of("limit", 2, "page", 0));
        assertThat(((Map<String, Object>) firstPage.get("featured")).get("id"))
                .isEqualTo(newestUpdated);
        assertThat((List<Map<String, Object>>) firstPage.get("items"))
                .extracting(item -> item.get("id"))
                .containsExactly(legacyAward, oldestUpdated)
                .doesNotContain(newestUpdated);
        // Five stored rows, one of them featured.
        assertThat(firstPage.get("totalItem")).isEqualTo(4);
        assertThat(firstPage.get("totalPage")).isEqualTo(2);
        assertThat(firstPage.get("hasNext")).isEqualTo(true);
        assertThat(firstPage.get("hasPrevious")).isEqualTo(false);

        Map<String, Object> secondPage = get(Map.of("limit", 2, "page", 1));
        assertThat(((Map<String, Object>) secondPage.get("featured")).get("id"))
                .isEqualTo(newestUpdated);
        assertThat((List<Map<String, Object>>) secondPage.get("items"))
                .extracting(item -> item.get("id"))
                .containsExactly(fullyDateless, awardedOnly)
                .doesNotContain(newestUpdated);
        assertThat(secondPage.get("totalItem")).isEqualTo(4);
        assertThat(secondPage.get("hasNext")).isEqualTo(false);
        assertThat(secondPage.get("hasPrevious")).isEqualTo(true);

        Map<String, Object> pastTheEnd = get(Map.of("limit", 2, "page", 2));
        assertThat((List<?>) pastTheEnd.get("items")).isEmpty();
        assertThat(pastTheEnd.get("totalItem")).isEqualTo(4);
    }

    @SuppressWarnings("unchecked")
    private void assertOrder(Map<String, ?> params, Integer expectedFeatured, List<Integer> expectedItems) {
        Map<String, Object> data = get(params);
        assertThat(((Map<String, Object>) data.get("featured")).get("id"))
                .as("featured for %s", params)
                .isEqualTo(expectedFeatured);
        assertThat((List<Map<String, Object>>) data.get("items"))
                .as("items for %s", params)
                .extracting(item -> item.get("id"))
                .containsExactlyElementsOf(expectedItems);
        assertThat(data.get("totalItem")).as("totalItem for %s", params).isEqualTo(expectedItems.size());
    }

    private Integer insert(
            String title,
            String topic,
            LocalDate awardedDate,
            LocalDateTime updatedAt,
            LocalDateTime createdAt) {
        DatabaseClient.GenericExecuteSpec spec = databaseClient.sql("""
                        INSERT INTO achievements (
                            organization_id, title, description, topic, status,
                            awarded_date, updated_at, created_at
                        ) VALUES (
                            :organizationId, :title, :description, :topic, 'APPROVED',
                            :awardedDate, :updatedAt, :createdAt
                        )
                        RETURNING id
                        """)
                .bind("organizationId", organizationId)
                .bind("title", title)
                .bind("description", "<p>" + title + " description</p>")
                .bind("topic", topic);

        spec = awardedDate == null
                ? spec.bindNull("awardedDate", LocalDate.class)
                : spec.bind("awardedDate", awardedDate);
        spec = updatedAt == null
                ? spec.bindNull("updatedAt", LocalDateTime.class)
                : spec.bind("updatedAt", updatedAt);
        spec = createdAt == null
                ? spec.bindNull("createdAt", LocalDateTime.class)
                : spec.bind("createdAt", createdAt);

        return spec.map((row, metadata) -> row.get("id", Integer.class)).one().block();
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> get(Map<String, ?> additionalParams) {
        Map<String, Object> response = webTestClient.get()
                .uri(uriBuilder -> {
                    uriBuilder.path("/api/articles/achievements")
                            .queryParam("organizationId", organizationId);
                    additionalParams.forEach(uriBuilder::queryParam);
                    return uriBuilder.build();
                })
                .exchange()
                .expectStatus().isOk()
                .expectBody(Map.class)
                .returnResult()
                .getResponseBody();
        return (Map<String, Object>) response.get("data");
    }
}
