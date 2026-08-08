package com.service.backend.integration;

import com.service.backend.auth.dto.LoginRequest;
import com.service.backend.article.dto.CreateNewsRequest;
import com.service.backend.article.dto.UpdateNewsRequest;
import com.service.backend.article.dto.CreateNewsCommentRequest;
import com.service.backend.article.dto.UpdateNewsCommentRequest;
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
import java.util.UUID;

@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class NewsIntegrationTest extends BaseIntegrationTest {

    @Autowired
    private DatabaseClient databaseClient;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private static final String TEST_PASSWORD = "Password123!";
    private static boolean dbInitialized = false;

    @BeforeEach
    void setup() {
        if (!dbInitialized) {
            databaseClient.sql("DELETE FROM news_comments").then().block();
            databaseClient.sql("DELETE FROM news").then().block();
            dbInitialized = true;
        }
    }

    private String randomIp() {
        return "192.168.1." + (int) (Math.random() * 255);
    }

    private Long prepareUser(String email, String role) {
        String hash = passwordEncoder.encode(TEST_PASSWORD);
        databaseClient.sql("INSERT INTO users (email, password_hash, status, role, full_name, must_change_password) " +
                "VALUES (:email, :hash, 'ACTIVE', :role, :fullName, false) " +
                "ON CONFLICT (email) DO NOTHING")
                .bind("email", email)
                .bind("hash", hash)
                .bind("role", role)
                .bind("fullName", "User " + email)
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
        prepareUser(email, role);
        LoginRequest request = new LoginRequest();
        request.setOrganizationId(1);
        request.setEmail(email);
        request.setPassword(TEST_PASSWORD);

        Map<String, Object> response = webTestClient.post().uri("/api/auth/login")
                .header("X-Forwarded-For", randomIp())
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .exchange()
                .expectStatus().isOk()
                .expectBody(Map.class)
                .returnResult()
                .getResponseBody();

        if (response != null && response.get("data") != null) {
            Map<String, Object> data = (Map<String, Object>) response.get("data");
            return (String) data.get("accessToken");
        }
        throw new RuntimeException("Failed to get access token");
    }

    private Long getUserIdByEmail(String email) {
        return databaseClient.sql("SELECT id FROM users WHERE email = :email")
                .bind("email", email)
                .map((row, metadata) -> row.get("id", Integer.class).longValue())
                .one()
                .block();
    }

    // =========================================================================
    // News Module Tests (TC1 - TC10)
    // =========================================================================

    @Test
    @Order(1)
    void createNews_TC1_Success() {
        String token = getValidAccessToken("admin_news_tc1@example.com", "ADMIN");

        CreateNewsRequest request = CreateNewsRequest.builder()
                .organizationId(1)
                .title("Test News Title " + UUID.randomUUID())
                .slug("test-news-" + UUID.randomUUID())
                .content("This is the content of the news")
                .topic("school_announcement")
                .build();

        webTestClient.post().uri("/api/articles/news")
                .header("X-Forwarded-For", randomIp())
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .exchange()
                .expectStatus().isCreated()
                .expectBody()
                .jsonPath("$.data.id").isNotEmpty()
                .jsonPath("$.data.title").isEqualTo(request.getTitle());
    }

    @Test
    @Order(2)
    void createNews_TC2_ForbiddenForUser() {
        String token = getValidAccessToken("user_news_tc2@example.com", "USER");

        CreateNewsRequest request = CreateNewsRequest.builder()
                .organizationId(1)
                .title("Test News Title User " + UUID.randomUUID())
                .content("User content")
                .topic("school_announcement")
                .build();

        webTestClient.post().uri("/api/articles/news")
                .header("X-Forwarded-For", randomIp())
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .exchange()
                .expectStatus().isForbidden();
    }

    @Test
    @Order(3)
    void getNewsList_TC3_Success() {
        String token = getValidAccessToken("admin_news_tc3@example.com", "ADMIN");

        webTestClient.get().uri("/api/articles/news?organizationId=1&page=0&size=10")
                .header("X-Forwarded-For", randomIp())
                .header("Authorization", "Bearer " + token)
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.data.items").isArray();
    }

    @Test
    @Order(4)
    void getNewsById_TC4_Success() {
        String token = getValidAccessToken("admin_news_tc4@example.com", "ADMIN");

        CreateNewsRequest request = CreateNewsRequest.builder()
                .organizationId(1)
                .title("Test News Title " + UUID.randomUUID())
                .content("Content")
                .topic("school_announcement")
                .build();

        Map<String, Object> response = webTestClient.post().uri("/api/articles/news")
                .header("X-Forwarded-For", randomIp())
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .exchange()
                .expectStatus().isCreated()
                .expectBody(Map.class)
                .returnResult()
                .getResponseBody();

        Integer newsId = (Integer) ((Map<String, Object>) response.get("data")).get("id");

        webTestClient.get().uri("/api/articles/news/" + newsId + "?organizationId=1")
                .header("X-Forwarded-For", randomIp())
                .header("Authorization", "Bearer " + token)
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.data.id").isEqualTo(newsId);
    }

    @Test
    @Order(5)
    void getNewsBySlug_TC5_Success() {
        String token = getValidAccessToken("admin_news_tc5@example.com", "ADMIN");
        String slug = "unique-slug-" + UUID.randomUUID();

        CreateNewsRequest request = CreateNewsRequest.builder()
                .organizationId(1)
                .title("Test Slug Title")
                .slug(slug)
                .content("Content")
                .topic("school_announcement")
                .build();

        webTestClient.post().uri("/api/articles/news")
                .header("X-Forwarded-For", randomIp())
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .exchange()
                .expectStatus().isCreated();

        webTestClient.get().uri("/api/articles/news/slug/" + slug + "?organizationId=1")
                .header("X-Forwarded-For", randomIp())
                .header("Authorization", "Bearer " + token)
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.data.slug").isEqualTo(slug);
    }

    @Test
    @Order(6)
    void updateNews_TC6_Success() {
        String token = getValidAccessToken("admin_news_tc6@example.com", "ADMIN");

        CreateNewsRequest request = CreateNewsRequest.builder()
                .organizationId(1)
                .title("Title before update")
                .content("Content before update")
                .topic("school_announcement")
                .build();

        Map<String, Object> response = webTestClient.post().uri("/api/articles/news")
                .header("X-Forwarded-For", randomIp())
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .exchange()
                .expectStatus().isCreated()
                .expectBody(Map.class)
                .returnResult()
                .getResponseBody();

        Integer newsId = (Integer) ((Map<String, Object>) response.get("data")).get("id");

        UpdateNewsRequest updateReq = UpdateNewsRequest.builder()
                .title("Title after update")
                .content("Content after update")
                .topic("school_announcement")
                .build();

        webTestClient.put().uri("/api/articles/news/" + newsId)
                .header("X-Forwarded-For", randomIp())
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(updateReq)
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.data.title").isEqualTo("Title after update");
    }

    @Test
    @Order(7)
    void deleteNews_TC7_Success() {
        String token = getValidAccessToken("admin_news_tc7@example.com", "ADMIN");

        CreateNewsRequest request = CreateNewsRequest.builder()
                .organizationId(1)
                .title("Title to delete")
                .content("Content")
                .topic("school_announcement")
                .build();

        Map<String, Object> response = webTestClient.post().uri("/api/articles/news")
                .header("X-Forwarded-For", randomIp())
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .exchange()
                .expectStatus().isCreated()
                .expectBody(Map.class)
                .returnResult()
                .getResponseBody();

        Integer newsId = (Integer) ((Map<String, Object>) response.get("data")).get("id");

        webTestClient.delete().uri("/api/articles/news/" + newsId)
                .header("X-Forwarded-For", randomIp())
                .header("Authorization", "Bearer " + token)
                .exchange()
                .expectStatus().isOk();

        // Verify deleted
        webTestClient.get().uri("/api/articles/news/" + newsId + "?organizationId=1")
                .header("X-Forwarded-For", randomIp())
                .header("Authorization", "Bearer " + token)
                .exchange()
                .expectStatus().isNotFound();
    }

    @Test
    @Order(8)
    void publishNews_TC8_Success() {
        String token = getValidAccessToken("admin_news_tc8@example.com", "ADMIN");

        CreateNewsRequest request = CreateNewsRequest.builder()
                .organizationId(1)
                .title("Draft News")
                .content("Content")
                .topic("school_announcement")
                .build();

        Map<String, Object> response = webTestClient.post().uri("/api/articles/news")
                .header("X-Forwarded-For", randomIp())
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .exchange()
                .expectStatus().isCreated()
                .expectBody(Map.class)
                .returnResult()
                .getResponseBody();

        Integer newsId = (Integer) ((Map<String, Object>) response.get("data")).get("id");

        webTestClient.post().uri("/api/articles/news/" + newsId + "/publish")
                .header("X-Forwarded-For", randomIp())
                .header("Authorization", "Bearer " + token)
                .exchange()
                .expectStatus().isOk();
    }

    @Test
    @Order(9)
    void hideNews_TC9_Success() {
        String token = getValidAccessToken("admin_news_tc9@example.com", "ADMIN");

        CreateNewsRequest request = CreateNewsRequest.builder()
                .organizationId(1)
                .title("News to Hide")
                .content("Content")
                .topic("school_announcement")
                .build();

        Map<String, Object> response = webTestClient.post().uri("/api/articles/news")
                .header("X-Forwarded-For", randomIp())
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .exchange()
                .expectStatus().isCreated()
                .expectBody(Map.class)
                .returnResult()
                .getResponseBody();

        Integer newsId = (Integer) ((Map<String, Object>) response.get("data")).get("id");

        // First publish it
        webTestClient.post().uri("/api/articles/news/" + newsId + "/publish")
                .header("X-Forwarded-For", randomIp())
                .header("Authorization", "Bearer " + token)
                .exchange()
                .expectStatus().isOk();

        // Then hide it
        webTestClient.post().uri("/api/articles/news/" + newsId + "/hide")
                .header("X-Forwarded-For", randomIp())
                .header("Authorization", "Bearer " + token)
                .exchange()
                .expectStatus().isOk();
    }

    @Test
    @Order(10)
    void getPublishedNews_TC10_Success() {
        String token = getValidAccessToken("user_news_tc10@example.com", "USER");

        webTestClient.get().uri("/api/articles/news/published?organizationId=1&page=0&limit=15")
                .header("X-Forwarded-For", randomIp())
                .header("Authorization", "Bearer " + token)
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.data.items").isArray()
                .jsonPath("$.data.currentPage").isEqualTo(0)
                .jsonPath("$.data.pageSize").isEqualTo(15)
                .jsonPath("$.data.totalPage").isNumber()
                .jsonPath("$.data.totalItem").isNumber()
                .jsonPath("$.data.hasNext").isBoolean()
                .jsonPath("$.data.hasPrevious").isEqualTo(false);
    }

    // =========================================================================
    // News Comment Tests (TC11 - TC15)
    // =========================================================================

    @Test
    @Order(11)
    void createComment_TC11_Success() {
        String adminEmail = "admin_news_tc11@example.com";
        String adminToken = getValidAccessToken(adminEmail, "ADMIN");
        
        String userEmail = "user_news_tc11@example.com";
        String userToken = getValidAccessToken(userEmail, "USER");
        Long userId = getUserIdByEmail(userEmail);

        // 1. Admin creates News
        CreateNewsRequest request = CreateNewsRequest.builder()
                .organizationId(1)
                .title("News for comment")
                .content("Content")
                .topic("school_announcement")
                .build();

        Map<String, Object> response = webTestClient.post().uri("/api/articles/news")
                .header("X-Forwarded-For", randomIp())
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .exchange()
                .expectStatus().isCreated()
                .expectBody(Map.class)
                .returnResult()
                .getResponseBody();

        Integer newsId = (Integer) ((Map<String, Object>) response.get("data")).get("id");

        // 2. User comments
        CreateNewsCommentRequest commentReq = new CreateNewsCommentRequest();
        commentReq.setNewsId(newsId);
        commentReq.setAuthorMemberId(userId.intValue());
        commentReq.setContent("This is a great news!");

        webTestClient.post().uri("/api/articles/news/" + newsId + "/comments")
                .header("X-Forwarded-For", randomIp())
                .header("Authorization", "Bearer " + userToken)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(commentReq)
                .exchange()
                .expectStatus().isCreated()
                .expectBody()
                .jsonPath("$.data.content").isEqualTo(commentReq.getContent());
    }

    @Test
    @Order(12)
    void getComments_TC12_Success() {
        String adminEmail = "admin_news_tc12@example.com";
        String adminToken = getValidAccessToken(adminEmail, "ADMIN");
        
        String userEmail = "user_news_tc12@example.com";
        String userToken = getValidAccessToken(userEmail, "USER");
        Long userId = getUserIdByEmail(userEmail);

        // 1. Admin creates News
        CreateNewsRequest request = CreateNewsRequest.builder()
                .organizationId(1)
                .title("News for comment fetch")
                .content("Content")
                .topic("school_announcement")
                .build();

        Map<String, Object> response = webTestClient.post().uri("/api/articles/news")
                .header("X-Forwarded-For", randomIp())
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .exchange()
                .expectStatus().isCreated()
                .expectBody(Map.class)
                .returnResult()
                .getResponseBody();

        Integer newsId = (Integer) ((Map<String, Object>) response.get("data")).get("id");

        // 2. User comments
        CreateNewsCommentRequest commentReq = new CreateNewsCommentRequest();
        commentReq.setNewsId(newsId);
        commentReq.setAuthorMemberId(userId.intValue());
        commentReq.setContent("First comment!");

        webTestClient.post().uri("/api/articles/news/" + newsId + "/comments")
                .header("X-Forwarded-For", randomIp())
                .header("Authorization", "Bearer " + userToken)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(commentReq)
                .exchange()
                .expectStatus().isCreated();

        // 3. Get comments
        webTestClient.get().uri("/api/articles/news/" + newsId + "/comments")
                .header("X-Forwarded-For", randomIp())
                .header("Authorization", "Bearer " + userToken)
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.data.items").isArray();
    }

    @Test
    @Order(13)
    void replyComment_TC13_Success() {
        String adminEmail = "admin_news_tc13@example.com";
        String adminToken = getValidAccessToken(adminEmail, "ADMIN");
        
        String userEmail1 = "user1_news_tc13@example.com";
        String userToken1 = getValidAccessToken(userEmail1, "USER");
        Long userId1 = getUserIdByEmail(userEmail1);
        
        String userEmail2 = "user2_news_tc13@example.com";
        String userToken2 = getValidAccessToken(userEmail2, "USER");
        Long userId2 = getUserIdByEmail(userEmail2);

        // 1. Admin creates News
        CreateNewsRequest request = CreateNewsRequest.builder()
                .organizationId(1)
                .title("News for reply")
                .content("Content")
                .topic("school_announcement")
                .build();

        Map<String, Object> response = webTestClient.post().uri("/api/articles/news")
                .header("X-Forwarded-For", randomIp())
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .exchange()
                .expectStatus().isCreated()
                .expectBody(Map.class)
                .returnResult()
                .getResponseBody();

        Integer newsId = (Integer) ((Map<String, Object>) response.get("data")).get("id");

        // 2. User 1 comments
        CreateNewsCommentRequest commentReq = new CreateNewsCommentRequest();
        commentReq.setNewsId(newsId);
        commentReq.setAuthorMemberId(userId1.intValue());
        commentReq.setContent("Parent comment");

        Map<String, Object> commentResp = webTestClient.post().uri("/api/articles/news/" + newsId + "/comments")
                .header("X-Forwarded-For", randomIp())
                .header("Authorization", "Bearer " + userToken1)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(commentReq)
                .exchange()
                .expectStatus().isCreated()
                .expectBody(Map.class)
                .returnResult()
                .getResponseBody();

        Integer parentCommentId = (Integer) ((Map<String, Object>) commentResp.get("data")).get("id");

        // 3. User 2 replies
        CreateNewsCommentRequest replyReq = new CreateNewsCommentRequest();
        replyReq.setNewsId(newsId);
        replyReq.setAuthorMemberId(userId2.intValue());
        replyReq.setContent("Reply to parent");

        webTestClient.post().uri("/api/articles/news/" + newsId + "/comments/" + parentCommentId + "/reply")
                .header("X-Forwarded-For", randomIp())
                .header("Authorization", "Bearer " + userToken2)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(replyReq)
                .exchange()
                .expectStatus().isCreated()
                .expectBody()
                .jsonPath("$.data.parentCommentId").isEqualTo(parentCommentId);
    }

    @Test
    @Order(14)
    void updateComment_TC14_Success() {
        String adminEmail = "admin_news_tc14@example.com";
        String adminToken = getValidAccessToken(adminEmail, "ADMIN");
        
        String userEmail = "user_news_tc14@example.com";
        String userToken = getValidAccessToken(userEmail, "USER");
        Long userId = getUserIdByEmail(userEmail);

        CreateNewsRequest request = CreateNewsRequest.builder()
                .organizationId(1)
                .title("News to update comment")
                .content("Content")
                .topic("school_announcement")
                .build();

        Map<String, Object> response = webTestClient.post().uri("/api/articles/news")
                .header("X-Forwarded-For", randomIp())
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .exchange()
                .expectStatus().isCreated()
                .expectBody(Map.class)
                .returnResult()
                .getResponseBody();

        Integer newsId = (Integer) ((Map<String, Object>) response.get("data")).get("id");

        CreateNewsCommentRequest commentReq = new CreateNewsCommentRequest();
        commentReq.setNewsId(newsId);
        commentReq.setAuthorMemberId(userId.intValue());
        commentReq.setContent("Original comment");

        Map<String, Object> commentResp = webTestClient.post().uri("/api/articles/news/" + newsId + "/comments")
                .header("X-Forwarded-For", randomIp())
                .header("Authorization", "Bearer " + userToken)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(commentReq)
                .exchange()
                .expectStatus().isCreated()
                .expectBody(Map.class)
                .returnResult()
                .getResponseBody();

        Integer commentId = (Integer) ((Map<String, Object>) commentResp.get("data")).get("id");

        UpdateNewsCommentRequest updateReq = new UpdateNewsCommentRequest();
        updateReq.setContent("Updated comment");

        webTestClient.put().uri("/api/articles/news/" + newsId + "/comments/" + commentId)
                .header("X-Forwarded-For", randomIp())
                .header("Authorization", "Bearer " + userToken)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(updateReq)
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.data.content").isEqualTo("Updated comment");
    }

    @Test
    @Order(15)
    void deleteComment_TC15_Success() {
        String adminEmail = "admin_news_tc15@example.com";
        String adminToken = getValidAccessToken(adminEmail, "ADMIN");
        
        String userEmail = "user_news_tc15@example.com";
        String userToken = getValidAccessToken(userEmail, "USER");
        Long userId = getUserIdByEmail(userEmail);

        CreateNewsRequest request = CreateNewsRequest.builder()
                .organizationId(1)
                .title("News to delete comment")
                .content("Content")
                .topic("school_announcement")
                .build();

        Map<String, Object> response = webTestClient.post().uri("/api/articles/news")
                .header("X-Forwarded-For", randomIp())
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .exchange()
                .expectStatus().isCreated()
                .expectBody(Map.class)
                .returnResult()
                .getResponseBody();

        Integer newsId = (Integer) ((Map<String, Object>) response.get("data")).get("id");

        CreateNewsCommentRequest commentReq = new CreateNewsCommentRequest();
        commentReq.setNewsId(newsId);
        commentReq.setAuthorMemberId(userId.intValue());
        commentReq.setContent("Comment to delete");

        Map<String, Object> commentResp = webTestClient.post().uri("/api/articles/news/" + newsId + "/comments")
                .header("X-Forwarded-For", randomIp())
                .header("Authorization", "Bearer " + userToken)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(commentReq)
                .exchange()
                .expectStatus().isCreated()
                .expectBody(Map.class)
                .returnResult()
                .getResponseBody();

        Integer commentId = (Integer) ((Map<String, Object>) commentResp.get("data")).get("id");

        webTestClient.delete().uri("/api/articles/news/" + newsId + "/comments/" + commentId)
                .header("X-Forwarded-For", randomIp())
                .header("Authorization", "Bearer " + userToken)
                .exchange()
                .expectStatus().isOk();
    }
}
