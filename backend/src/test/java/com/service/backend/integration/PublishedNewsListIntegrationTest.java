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

import static org.assertj.core.api.Assertions.assertThat;

class PublishedNewsListIntegrationTest extends BaseIntegrationTest {

    @Autowired
    private DatabaseClient databaseClient;

    @Autowired
    private CacheUtils cacheUtils;

    private Integer organizationId;

    @BeforeEach
    void setUp() {
        databaseClient.sql("DELETE FROM news_comments").then().block();
        databaseClient.sql("DELETE FROM news").then().block();
        cacheUtils.clear(CacheNames.NEWS).block();
        organizationId = databaseClient.sql("SELECT id FROM organizations ORDER BY id LIMIT 1")
                .map((row, metadata) -> row.get("id", Integer.class))
                .one()
                .block();
    }

    @Test
    @SuppressWarnings("unchecked")
    void publishedListAppliesFeaturedFiltersPreviewVisibilityAndValidationContract() {
        String fullFeaturedContent = "<p>AT&amp;T &quot;quoted&quot; &#39;apostrophe&#39; &#169; "
                + "long preview text ".repeat(30) + "</p>";
        Integer featuredId = insertNews(
                "Fixed newest featured", fullFeaturedContent, "school_announcement",
                false, LocalDateTime.of(2099, 1, 10, 10, 0));
        Integer matchingId = insertNews(
                "Literal 100%_match needle", "<div>Filter target in full content</div>",
                "academic_research", false, LocalDateTime.of(2099, 1, 9, 10, 0));
        Integer otherId = insertNews(
                "Literal 100ABmatch", "<p>Other published record</p>",
                "alumni_news", false, LocalDateTime.of(2099, 1, 8, 10, 0));
        Integer hiddenId = insertNews(
                "Hidden newest", "<p>must never leak</p>", "academic_research",
                true, LocalDateTime.of(2100, 1, 1, 10, 0));

        Map<String, Object> defaultData = getPublished(Map.of());
        Map<String, Object> featured = (Map<String, Object>) defaultData.get("featured");
        List<Map<String, Object>> defaultItems = (List<Map<String, Object>>) defaultData.get("items");

        assertThat(featured.get("id")).isEqualTo(featuredId);
        assertThat(defaultItems).extracting(item -> item.get("id"))
                .containsExactly(matchingId, otherId)
                .doesNotContain(featuredId, hiddenId);
        assertThat(defaultData.get("totalItem")).isEqualTo(2);
        assertThat(defaultData.get("pageSize")).isEqualTo(15);

        String preview = (String) featured.get("content");
        assertThat(preview)
                .startsWith("AT&T \"quoted\" 'apostrophe'")
                .doesNotContain("<p>", "</p>", "&amp;", "&#39;", "&#169;");
        assertThat(preview.length()).isLessThanOrEqualTo(260);

        Map<String, Object> filtered = getPublished(Map.of(
                "keyword", "needle",
                "topics", "academic_research",
                "fromDate", "2099-01-09",
                "toDate", "2099-01-09",
                "sort", "oldest"));
        assertThat(((Map<String, Object>) filtered.get("featured")).get("id"))
                .isEqualTo(featuredId);
        assertThat((List<Map<String, Object>>) filtered.get("items"))
                .extracting(item -> item.get("id"))
                .containsExactly(matchingId);
        assertThat(filtered.get("totalItem")).isEqualTo(1);
        assertThat(filtered.get("totalPage")).isEqualTo(1);

        Map<String, Object> literalWildcard = getPublished(Map.of("keyword", "%_"));
        assertThat((List<Map<String, Object>>) literalWildcard.get("items"))
                .extracting(item -> item.get("id"))
                .containsExactly(matchingId);
        assertThat(literalWildcard.get("totalItem")).isEqualTo(1);

        Map<String, Object> otherOrganization = getPublished(
                Map.of("organizationId", organizationId + 999_999));
        assertThat(otherOrganization.get("featured")).isNull();
        assertThat((List<?>) otherOrganization.get("items")).isEmpty();
        assertThat(otherOrganization.get("totalItem")).isEqualTo(0);

        webTestClient.get()
                .uri(uriBuilder -> uriBuilder.path("/api/articles/news/published")
                        .queryParam("organizationId", organizationId)
                        .queryParam("limit", 16)
                        .build())
                .exchange()
                .expectStatus().isBadRequest();

        webTestClient.get()
                .uri(uriBuilder -> uriBuilder.path("/api/articles/news/{id}")
                        .queryParam("organizationId", organizationId)
                        .build(featuredId))
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.data.content").isEqualTo(fullFeaturedContent);
    }

    private Integer insertNews(
            String title,
            String content,
            String topic,
            boolean hidden,
            LocalDateTime timestamp) {
        return databaseClient.sql("""
                        INSERT INTO news (
                            organization_id, title, slug, content, topic, is_hidden, created_at, updated_at
                        ) VALUES (
                            :organizationId, :title, :slug, :content, :topic, :hidden, :createdAt, :updatedAt
                        )
                        RETURNING id
                        """)
                .bind("organizationId", organizationId)
                .bind("title", title)
                .bind("slug", title.toLowerCase().replaceAll("[^a-z0-9]+", "-") + "-" + timestamp.getDayOfMonth())
                .bind("content", content)
                .bind("topic", topic)
                .bind("hidden", hidden)
                .bind("createdAt", timestamp)
                .bind("updatedAt", timestamp)
                .map((row, metadata) -> row.get("id", Integer.class))
                .one()
                .block();
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> getPublished(Map<String, ?> additionalParams) {
        Map<String, Object> response = webTestClient.get()
                .uri(uriBuilder -> {
                    Object requestedOrganizationId = additionalParams.containsKey("organizationId")
                            ? additionalParams.get("organizationId")
                            : organizationId;
                    uriBuilder.path("/api/articles/news/published")
                            .queryParam("organizationId", requestedOrganizationId);
                    additionalParams.forEach((key, value) -> {
                        if (!"organizationId".equals(key)) uriBuilder.queryParam(key, value);
                    });
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
