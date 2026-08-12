package com.service.backend.integration;

import com.service.backend.shared.utils.CacheNames;
import com.service.backend.shared.utils.CacheUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.r2dbc.core.DatabaseClient;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Executes the {@code @Query} SQL behind {@code GET /api/articles/alumni-posts/published} against a
 * real Postgres. The service-level unit tests mock the repository, so the hand-written ORDER BY —
 * the part that has already shipped broken twice — is only ever exercised here.
 *
 * Everything is scoped to a throwaway organization so this class never disturbs rows other
 * integration tests rely on.
 */
class PublishedAlumniPostListIntegrationTest extends BaseIntegrationTest {

    @Autowired
    private DatabaseClient databaseClient;

    @Autowired
    private CacheUtils cacheUtils;

    private static Integer organizationId;

    /** Neither updated_at nor created_at: genuinely dateless, must sort last. */
    private Integer firstDateless;
    /** Oldest dated post. */
    private Integer oldestPost;
    /** Newest dated post. */
    private Integer newestPost;
    /** A second dateless post, so the id tiebreaker among NULL dates is pinned too. */
    private Integer secondDateless;
    /** Between the oldest and the newest. */
    private Integer middlePost;

    @BeforeEach
    void setUp() {
        if (organizationId == null) {
            organizationId = databaseClient.sql("""
                            INSERT INTO organizations (name, slug, status)
                            VALUES (:name, :slug, 'ACTIVE')
                            RETURNING id
                            """)
                    .bind("name", "Published alumni post list org")
                    .bind("slug", "published-alumni-post-list-" + UUID.randomUUID())
                    .map((row, metadata) -> row.get("id", Integer.class))
                    .one()
                    .block();
        }

        databaseClient.sql("DELETE FROM alumni_posts WHERE organization_id = :organizationId")
                .bind("organizationId", organizationId)
                .then()
                .block();
        cacheUtils.clear(CacheNames.ALUMNI_POST).block();

        firstDateless = insert("First dateless", "alumni_profile", false, null, null);
        oldestPost = insert("Oldest post", "startup", false,
                LocalDateTime.of(2024, 5, 1, 10, 0), LocalDateTime.of(2024, 5, 1, 10, 0));
        newestPost = insert("Newest post", "alumni_profile", false,
                LocalDateTime.of(2024, 8, 1, 10, 0), LocalDateTime.of(2024, 7, 1, 10, 0));
        secondDateless = insert("Second dateless", "startup", false, null, null);
        middlePost = insert("Middle post", "alumni_profile", false,
                LocalDateTime.of(2024, 6, 1, 10, 0), LocalDateTime.of(2024, 6, 1, 10, 0));
        insert("Hidden newest", "alumni_profile", true,
                LocalDateTime.of(2099, 1, 1, 10, 0), LocalDateTime.of(2099, 1, 1, 10, 0));
    }

    /**
     * Pins the full ORDER BY for both directions, including the regression guard that a post with
     * neither updated_at nor created_at sorts LAST. Postgres defaults DESC to NULLS FIRST, so
     * without the explicit NULLS LAST a dateless post floats to the top and is even picked as the
     * featured hero.
     */
    @Test
    void orderingFollowsDirectionAndPutsDatelessPostsLast() {
        // Keys on COALESCE(updated_at, created_at): newestPost 08-01, middlePost 06-01,
        // oldestPost 05-01, then the two dateless posts broken by id in the requested direction.
        assertOrder(Map.of("direction", "newest"),
                newestPost, List.of(middlePost, oldestPost, secondDateless, firstDateless));
        assertOrder(Map.of("direction", "oldest"),
                oldestPost, List.of(middlePost, newestPost, firstDateless, secondDateless));

        // Default direction is 'newest'.
        assertOrder(Map.of(), newestPost,
                List.of(middlePost, oldestPost, secondDateless, firstDateless));
    }

    /**
     * The featured post is hoisted out of {@code items} and out of {@code totalItem}, and paging
     * walks the remainder with offset = page * limit. Page 1 is what regressed silently before:
     * nothing else in the suite requests it.
     */
    @Test
    @SuppressWarnings("unchecked")
    void featuredIsExcludedFromItemsAndTotalWhilePagingWalksTheRemainder() {
        Map<String, Object> firstPage = get(Map.of("limit", 2, "page", 0));
        assertThat(((Map<String, Object>) firstPage.get("featured")).get("id")).isEqualTo(newestPost);
        assertThat((List<Map<String, Object>>) firstPage.get("items"))
                .extracting(item -> item.get("id"))
                .containsExactly(middlePost, oldestPost)
                .doesNotContain(newestPost);
        // Five visible posts, one of them featured; the hidden post never counts.
        assertThat(firstPage.get("totalItem")).isEqualTo(4);
        assertThat(firstPage.get("totalPage")).isEqualTo(2);
        assertThat(firstPage.get("hasNext")).isEqualTo(true);
        assertThat(firstPage.get("hasPrevious")).isEqualTo(false);

        Map<String, Object> secondPage = get(Map.of("limit", 2, "page", 1));
        assertThat(((Map<String, Object>) secondPage.get("featured")).get("id")).isEqualTo(newestPost);
        assertThat((List<Map<String, Object>>) secondPage.get("items"))
                .extracting(item -> item.get("id"))
                .containsExactly(secondDateless, firstDateless)
                .doesNotContain(newestPost);
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
            boolean hidden,
            LocalDateTime updatedAt,
            LocalDateTime createdAt) {
        DatabaseClient.GenericExecuteSpec spec = databaseClient.sql("""
                        INSERT INTO alumni_posts (
                            organization_id, title, slug, content, topic, is_hidden,
                            updated_at, created_at
                        ) VALUES (
                            :organizationId, :title, :slug, :content, :topic, :hidden,
                            :updatedAt, :createdAt
                        )
                        RETURNING id
                        """)
                .bind("organizationId", organizationId)
                .bind("title", title)
                .bind("slug", title.toLowerCase().replaceAll("[^a-z0-9]+", "-") + "-" + UUID.randomUUID())
                .bind("content", "<p>" + title + " content</p>")
                .bind("topic", topic)
                .bind("hidden", hidden);

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
                    uriBuilder.path("/api/articles/alumni-posts/published")
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
