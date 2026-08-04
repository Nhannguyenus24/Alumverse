package com.service.backend.integration;

import com.service.backend.auth.dto.LoginRequest;
import com.service.backend.forum.dto.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.r2dbc.core.DatabaseClient;
import org.springframework.security.crypto.password.PasswordEncoder;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class ForumIntegrationTest extends BaseIntegrationTest {

    @Autowired
    private DatabaseClient databaseClient;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private static final String TEST_PASSWORD = "Password123!";
    private static boolean dbInitialized = false;

    private static String userToken;
    private static Long testUserId;
    private static Integer testOrganizationId = 1;

    @BeforeEach
    void setup() {
        if (!dbInitialized) {
            databaseClient.sql("DELETE FROM forum_post_reactions").then().block();
            databaseClient.sql("DELETE FROM forum_post_reports").then().block();
            databaseClient.sql("DELETE FROM forum_posts").then().block();
            databaseClient.sql("DELETE FROM forum_topic_subscriptions").then().block();
            databaseClient.sql("DELETE FROM forum_topics").then().block();
            databaseClient.sql("DELETE FROM forum_categories").then().block();
            
            // Set role to ADMIN to allow category creation
            testUserId = prepareUser("forumtest@test.com", "ADMIN");
            userToken = getValidAccessToken("forumtest@test.com", "ADMIN");
            
            dbInitialized = true;
        }
    }

    private Long prepareUser(String email, String role) {
        String hash = passwordEncoder.encode(TEST_PASSWORD);
        databaseClient.sql("INSERT INTO users (email, password_hash, status, role, full_name, must_change_password) " +
                "VALUES (:email, :hash, 'ACTIVE', :role, :fullName, false) " +
                "ON CONFLICT (email) DO NOTHING")
                .bind("email", email)
                .bind("hash", hash)
                .bind("role", role)
                .bind("fullName", "Forum User")
                .then().block();

        Long userId = databaseClient.sql("SELECT id FROM users WHERE email = :email")
                .bind("email", email)
                .map((row, metadata) -> row.get("id", Integer.class).longValue())
                .one()
                .block();

        databaseClient.sql("INSERT INTO organization_members (organization_id, user_id, verification_level) " +
                "VALUES (1, :userId, 4) ON CONFLICT DO NOTHING")
                .bind("userId", userId)
                .then().block();

        return userId;
    }

    private String getValidAccessToken(String email, String role) {
        LoginRequest request = new LoginRequest();
        request.setOrganizationId(1);
        request.setEmail(email);
        request.setPassword(TEST_PASSWORD);

        Map<String, Object> response = webTestClient.post().uri("/api/auth/login")
                .header("X-Forwarded-For", "127.0.0.1")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .exchange()
                .expectStatus().isOk()
                .expectBody(Map.class)
                .returnResult()
                .getResponseBody();

        Map<String, Object> data = (Map<String, Object>) response.get("data");
        return (String) data.get("accessToken");
    }

    // --- CATEGORY TESTS ---

    @Test
    @Order(1)
    void createCategory_success() {
        CreateForumCategoryRequest request = new CreateForumCategoryRequest();
        request.setOrganizationId(testOrganizationId);
        request.setName("Hỏi đáp học tập");
        request.setDescription("Chuyên mục hỏi đáp về học tập");

        webTestClient.post()
                .uri("/api/forum/category")
                .header("Authorization", "Bearer " + userToken)
                .bodyValue(request)
                .exchange()
                .expectStatus().isCreated()
                .expectBody()
                .jsonPath("$.data.id").isNotEmpty()
                .jsonPath("$.data.name").isEqualTo("Hỏi đáp học tập");
    }

    @Test
    @Order(2)
    void getAllCategories_success() {
        webTestClient.get()
                .uri("/api/forum/category?organizationId=" + testOrganizationId)
                .header("Authorization", "Bearer " + userToken)
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.data[0].name").isEqualTo("Hỏi đáp học tập");
    }

    @Test
    @Order(3)
    void updateCategory_success() {
        Integer categoryId = getFirstCategoryId();

        UpdateForumCategoryRequest request = new UpdateForumCategoryRequest();
        request.setName("Hỏi đáp học tập Update");
        request.setDescription("Updated desc");

        webTestClient.put()
                .uri("/api/forum/category/" + categoryId)
                .header("Authorization", "Bearer " + userToken)
                .bodyValue(request)
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.data.name").isEqualTo("Hỏi đáp học tập Update");
    }

    // --- TOPIC TESTS ---

    @Test
    @Order(4)
    void createTopic_success() {
        Integer categoryId = getFirstCategoryId();

        CreateForumTopicRequest request = new CreateForumTopicRequest();
        request.setOrganizationId(testOrganizationId);
        request.setCategoryId(categoryId);
        request.setCreatedByMemberId(testUserId.intValue());
        request.setTitle("Làm sao để học tốt Java?");

        webTestClient.post()
                .uri("/api/forum/topic")
                .header("Authorization", "Bearer " + userToken)
                .bodyValue(request)
                .exchange()
                .expectStatus().isCreated()
                .expectBody()
                .jsonPath("$.data.id").isNotEmpty()
                .jsonPath("$.data.title").isEqualTo("Làm sao để học tốt Java?");
    }

    @Test
    @Order(5)
    void getTopicsByCategory_success() {
        Integer categoryId = getFirstCategoryId();
        
        // Update topic to ACTIVE so it shows up in queries
        databaseClient.sql("UPDATE forum_topics SET status = 'ACTIVE'").then().block();

        webTestClient.get()
                .uri("/api/forum/topic?categoryId=" + categoryId)
                .header("Authorization", "Bearer " + userToken)
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.data.items[0].title").isEqualTo("Làm sao để học tốt Java?");
    }

    @Test
    @Order(6)
    void updateTopic_success() {
        Integer topicId = getFirstTopicId();
        Integer categoryId = getFirstCategoryId();

        UpdateForumTopicRequest request = new UpdateForumTopicRequest();
        request.setTitle("Làm sao để học tốt Java Update?");
        request.setCategoryId(categoryId);

        webTestClient.put()
                .uri("/api/forum/topic/" + topicId)
                .header("Authorization", "Bearer " + userToken)
                .bodyValue(request)
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.data.title").isEqualTo("Làm sao để học tốt Java Update?");
    }

    // --- SUBSCRIPTION TESTS ---

    @Test
    @Order(7)
    void subscribeToTopic_success() {
        Integer topicId = getFirstTopicId();

        CreateForumTopicSubscriptionRequest request = new CreateForumTopicSubscriptionRequest();
        request.setTopicId(topicId);
        request.setMemberId(testUserId.intValue());

        webTestClient.post()
                .uri("/api/forum/topic/subscribe")
                .header("Authorization", "Bearer " + userToken)
                .bodyValue(request)
                .exchange()
                .expectStatus().isCreated()
                .expectBody()
                .jsonPath("$.message").isEqualTo("Subscribed to topic successfully");
    }

    @Test
    @Order(8)
    void checkSubscriptionStatus_success() {
        Integer topicId = getFirstTopicId();

        webTestClient.get()
                .uri("/api/forum/topic/" + topicId + "/is-subscribed?memberId=" + testUserId.intValue())
                .header("Authorization", "Bearer " + userToken)
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.data").isEqualTo(true);
    }

    // --- POST/COMMENT TESTS ---

    @Test
    @Order(9)
    void createPost_success() {
        Integer topicId = getFirstTopicId();

        CreateForumPostRequest request = new CreateForumPostRequest();
        request.setTopicId(topicId);
        request.setAuthorMemberId(testUserId.intValue());
        request.setContent("Kinh nghiệm là code nhiều nhé em.");

        webTestClient.post()
                .uri("/api/forum/post")
                .header("Authorization", "Bearer " + userToken)
                .bodyValue(request)
                .exchange()
                .expectStatus().isCreated()
                .expectBody()
                .jsonPath("$.data.id").isNotEmpty()
                .jsonPath("$.data.content").isEqualTo("Kinh nghiệm là code nhiều nhé em.");
    }

    @Test
    @Order(10)
    void answerToPost_success() {
        Integer postId = getFirstPostId();
        Integer topicId = getFirstTopicId();

        CreateForumPostRequest request = new CreateForumPostRequest();
        request.setTopicId(topicId);
        request.setAuthorMemberId(testUserId.intValue());
        request.setContent("Cảm ơn anh nhiều ạ.");
        
        webTestClient.post()
                .uri("/api/forum/post/" + postId + "/answer")
                .header("Authorization", "Bearer " + userToken)
                .bodyValue(request)
                .exchange()
                .expectStatus().isCreated()
                .expectBody()
                .jsonPath("$.data.content").isEqualTo("Cảm ơn anh nhiều ạ.");
    }

    @Test
    @Order(11)
    void getPostsByTopic_success() {
        Integer topicId = getFirstTopicId();

        webTestClient.get()
                .uri("/api/forum/post?topicId=" + topicId)
                .header("Authorization", "Bearer " + userToken)
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.data.items.length()").isNumber();
    }

    // --- REACTION & REPORT TESTS ---

    @Test
    @Order(12)
    void reactToPost_success() {
        Integer postId = getFirstPostId();

        CreateForumPostReactionRequest request = new CreateForumPostReactionRequest();
        request.setPostId(postId);
        request.setMemberId(testUserId.intValue());

        webTestClient.post()
                .uri("/api/forum/post/react")
                .header("Authorization", "Bearer " + userToken)
                .bodyValue(request)
                .exchange()
                .expectStatus().isCreated()
                .expectBody()
                .jsonPath("$.message").isEqualTo("Like added successfully");
    }

    @Test
    @Order(13)
    void getPostReactions_success() {
        Integer postId = getFirstPostId();

        webTestClient.get()
                .uri("/api/forum/post/" + postId + "/reactions/count")
                .header("Authorization", "Bearer " + userToken)
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.data.likes").isEqualTo(1);
    }

    @Test
    @Order(14)
    void unreactToPost_success() {
        Integer postId = getFirstPostId();

        CreateForumPostReactionRequest request = new CreateForumPostReactionRequest();
        request.setPostId(postId);
        request.setMemberId(testUserId.intValue());

        webTestClient.post()
                .uri("/api/forum/post/react")
                .header("Authorization", "Bearer " + userToken)
                .bodyValue(request)
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.message").isEqualTo("Like removed successfully");
    }

    @Test
    @Order(15)
    void reportPost_success() {
        Integer postId = getFirstPostId();

        CreateForumPostReportRequest request = new CreateForumPostReportRequest();
        request.setReporterMemberId(testUserId.intValue());
        request.setReason("SPAM");

        webTestClient.post()
                .uri("/api/forum/post/" + postId + "/report")
                .header("Authorization", "Bearer " + userToken)
                .bodyValue(request)
                .exchange()
                .expectStatus().isCreated()
                .expectBody()
                .jsonPath("$.data.reason").isEqualTo("SPAM");
    }

    // --- DELETION TESTS ---

    @Test
    @Order(16)
    void deletePost_success() {
        // Delete all posts (the answers and original)
        // First delete reports and answers (id > firstId) then the first one
        Integer postId = getFirstPostId();
        databaseClient.sql("DELETE FROM forum_post_reports WHERE post_id = " + postId).then().block();
        databaseClient.sql("DELETE FROM forum_posts WHERE answer_to_post_id IS NOT NULL").then().block();

        webTestClient.delete()
                .uri("/api/forum/post/" + postId)
                .header("Authorization", "Bearer " + userToken)
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.message").isEqualTo("Forum post deleted successfully");
    }

    @Test
    @Order(17)
    void unsubscribeToTopic_success() {
        Integer topicId = getFirstTopicId();

        CreateForumTopicSubscriptionRequest request = new CreateForumTopicSubscriptionRequest();
        request.setTopicId(topicId);
        request.setMemberId(testUserId.intValue()); // Doing it again removes it

        webTestClient.post()
                .uri("/api/forum/topic/subscribe")
                .header("Authorization", "Bearer " + userToken)
                .bodyValue(request)
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.message").isEqualTo("Unsubscribed from topic successfully");
    }

    @Test
    @Order(18)
    void deleteTopic_success() {
        Integer topicId = getFirstTopicId();

        webTestClient.delete()
                .uri("/api/forum/topic/" + topicId)
                .header("Authorization", "Bearer " + userToken)
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.message").isEqualTo("Forum topic deleted successfully");
    }

    // --- UTILS ---

    private Integer getFirstCategoryId() {
        return databaseClient.sql("SELECT id FROM forum_categories ORDER BY id DESC LIMIT 1")
                .fetch().first().map(m -> (Integer) m.get("id")).block();
    }

    private Integer getFirstTopicId() {
        return databaseClient.sql("SELECT id FROM forum_topics ORDER BY id DESC LIMIT 1")
                .fetch().first().map(m -> (Integer) m.get("id")).block();
    }

    private Integer getFirstPostId() {
        return databaseClient.sql("SELECT id FROM forum_posts ORDER BY id ASC LIMIT 1")
                .fetch().first().map(m -> (Integer) m.get("id")).block();
    }
}
