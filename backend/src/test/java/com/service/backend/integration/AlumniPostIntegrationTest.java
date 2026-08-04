package com.service.backend.integration;

import com.service.backend.auth.dto.LoginRequest;
import com.service.backend.article.dto.CreateAlumniPostRequest;
import com.service.backend.article.dto.UpdateAlumniPostRequest;
import com.service.backend.article.dto.CreateAlumniPostCommentRequest;
import com.service.backend.article.dto.UpdateAlumniPostCommentRequest;
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
public class AlumniPostIntegrationTest extends BaseIntegrationTest {

    @Autowired
    private DatabaseClient databaseClient;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private static final String TEST_PASSWORD = "Password123!";
    private static boolean dbInitialized = false;

    @BeforeEach
    void setup() {
        if (!dbInitialized) {
            databaseClient.sql("DELETE FROM alumni_post_comments").then().block();
            databaseClient.sql("DELETE FROM alumni_posts").then().block();
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
    // AlumniPost Module Tests (TC16 - TC26)
    // =========================================================================

    @Test
    @Order(16)
    void createAlumniPost_TC16_Success() {
        String token = getValidAccessToken("admin_alumni_tc16@example.com", "ADMIN");

        CreateAlumniPostRequest request = CreateAlumniPostRequest.builder()
                .organizationId(1)
                .title("Test AlumniPost Title " + UUID.randomUUID())
                .slug("test-alumni-post-" + UUID.randomUUID())
                .content("This is the content of the post")
                .topic("alumni_profile")
                .build();

        webTestClient.post().uri("/api/articles/alumni-posts")
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
    @Order(17)
    void createAlumniPost_TC17_SuccessForUser() {
        String token = getValidAccessToken("user_alumni_tc17@example.com", "USER");

        CreateAlumniPostRequest request = CreateAlumniPostRequest.builder()
                .organizationId(1)
                .title("Test AlumniPost Title User " + UUID.randomUUID())
                .content("User content")
                .topic("alumni_profile")
                .build();

        webTestClient.post().uri("/api/articles/alumni-posts")
                .header("X-Forwarded-For", randomIp())
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .exchange()
                .expectStatus().isCreated()
                .expectBody()
                .jsonPath("$.data.isHidden").isEqualTo(true);
    }

    @Test
    @Order(18)
    void getAlumniPostList_TC18_Success() {
        String token = getValidAccessToken("admin_alumni_tc18@example.com", "ADMIN");

        webTestClient.get().uri("/api/articles/alumni-posts?organizationId=1&page=0&limit=10")
                .header("X-Forwarded-For", randomIp())
                .header("Authorization", "Bearer " + token)
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.data.items").isArray();
    }

    @Test
    @Order(19)
    void getAlumniPostById_TC19_Success() {
        String token = getValidAccessToken("admin_alumni_tc19@example.com", "ADMIN");

        CreateAlumniPostRequest request = CreateAlumniPostRequest.builder()
                .organizationId(1)
                .title("Test AlumniPost Title " + UUID.randomUUID())
                .content("Content")
                .topic("alumni_profile")
                .build();

        Map<String, Object> response = webTestClient.post().uri("/api/articles/alumni-posts")
                .header("X-Forwarded-For", randomIp())
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .exchange()
                .expectStatus().isCreated()
                .expectBody(Map.class)
                .returnResult()
                .getResponseBody();

        Integer postId = (Integer) ((Map<String, Object>) response.get("data")).get("id");

        webTestClient.get().uri("/api/articles/alumni-posts/" + postId + "?organizationId=1")
                .header("X-Forwarded-For", randomIp())
                .header("Authorization", "Bearer " + token)
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.data.id").isEqualTo(postId);
    }

    @Test
    @Order(20)
    void getAlumniPostBySlug_TC20_Success() {
        String token = getValidAccessToken("admin_alumni_tc20@example.com", "ADMIN");
        String slug = "unique-slug-" + UUID.randomUUID();

        CreateAlumniPostRequest request = CreateAlumniPostRequest.builder()
                .organizationId(1)
                .title("Test Slug Title")
                .slug(slug)
                .content("Content")
                .topic("alumni_profile")
                .build();

        webTestClient.post().uri("/api/articles/alumni-posts")
                .header("X-Forwarded-For", randomIp())
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .exchange()
                .expectStatus().isCreated();

        webTestClient.get().uri("/api/articles/alumni-posts/slug/" + slug + "?organizationId=1")
                .header("X-Forwarded-For", randomIp())
                .header("Authorization", "Bearer " + token)
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.data.slug").isEqualTo(slug);
    }

    @Test
    @Order(21)
    void updateAlumniPost_TC21_Success() {
        String token = getValidAccessToken("admin_alumni_tc21@example.com", "ADMIN");

        CreateAlumniPostRequest request = CreateAlumniPostRequest.builder()
                .organizationId(1)
                .title("Title before update")
                .content("Content before update")
                .topic("alumni_profile")
                .build();

        Map<String, Object> response = webTestClient.post().uri("/api/articles/alumni-posts")
                .header("X-Forwarded-For", randomIp())
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .exchange()
                .expectStatus().isCreated()
                .expectBody(Map.class)
                .returnResult()
                .getResponseBody();

        Integer postId = (Integer) ((Map<String, Object>) response.get("data")).get("id");

        UpdateAlumniPostRequest updateReq = UpdateAlumniPostRequest.builder()
                .title("Title after update")
                .content("Content after update")
                .topic("alumni_profile")
                .build();

        webTestClient.put().uri("/api/articles/alumni-posts/" + postId)
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
    @Order(22)
    void deleteAlumniPost_TC22_Success() {
        String token = getValidAccessToken("admin_alumni_tc22@example.com", "ADMIN");

        CreateAlumniPostRequest request = CreateAlumniPostRequest.builder()
                .organizationId(1)
                .title("Title to delete")
                .content("Content")
                .topic("alumni_profile")
                .build();

        Map<String, Object> response = webTestClient.post().uri("/api/articles/alumni-posts")
                .header("X-Forwarded-For", randomIp())
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .exchange()
                .expectStatus().isCreated()
                .expectBody(Map.class)
                .returnResult()
                .getResponseBody();

        Integer postId = (Integer) ((Map<String, Object>) response.get("data")).get("id");

        webTestClient.delete().uri("/api/articles/alumni-posts/" + postId)
                .header("X-Forwarded-For", randomIp())
                .header("Authorization", "Bearer " + token)
                .exchange()
                .expectStatus().isOk();

        // Verify deleted
        webTestClient.get().uri("/api/articles/alumni-posts/" + postId + "?organizationId=1")
                .header("X-Forwarded-For", randomIp())
                .header("Authorization", "Bearer " + token)
                .exchange()
                .expectStatus().isNotFound();
    }

    @Test
    @Order(23)
    void publishAlumniPost_TC23_Success() {
        String token = getValidAccessToken("admin_alumni_tc23@example.com", "ADMIN");

        CreateAlumniPostRequest request = CreateAlumniPostRequest.builder()
                .organizationId(1)
                .title("Draft AlumniPost")
                .content("Content")
                .topic("alumni_profile")
                .build();

        Map<String, Object> response = webTestClient.post().uri("/api/articles/alumni-posts")
                .header("X-Forwarded-For", randomIp())
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .exchange()
                .expectStatus().isCreated()
                .expectBody(Map.class)
                .returnResult()
                .getResponseBody();

        Integer postId = (Integer) ((Map<String, Object>) response.get("data")).get("id");

        webTestClient.post().uri("/api/articles/alumni-posts/" + postId + "/publish")
                .header("X-Forwarded-For", randomIp())
                .header("Authorization", "Bearer " + token)
                .exchange()
                .expectStatus().isOk();
    }

    @Test
    @Order(24)
    void hideAlumniPost_TC24_Success() {
        String token = getValidAccessToken("admin_alumni_tc24@example.com", "ADMIN");

        CreateAlumniPostRequest request = CreateAlumniPostRequest.builder()
                .organizationId(1)
                .title("AlumniPost to Hide")
                .content("Content")
                .topic("alumni_profile")
                .build();

        Map<String, Object> response = webTestClient.post().uri("/api/articles/alumni-posts")
                .header("X-Forwarded-For", randomIp())
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .exchange()
                .expectStatus().isCreated()
                .expectBody(Map.class)
                .returnResult()
                .getResponseBody();

        Integer postId = (Integer) ((Map<String, Object>) response.get("data")).get("id");

        // First publish it
        webTestClient.post().uri("/api/articles/alumni-posts/" + postId + "/publish")
                .header("X-Forwarded-For", randomIp())
                .header("Authorization", "Bearer " + token)
                .exchange()
                .expectStatus().isOk();

        // Then hide it
        webTestClient.post().uri("/api/articles/alumni-posts/" + postId + "/hide")
                .header("X-Forwarded-For", randomIp())
                .header("Authorization", "Bearer " + token)
                .exchange()
                .expectStatus().isOk();
    }

    @Test
    @Order(25)
    void getPublishedAlumniPosts_TC25_Success() {
        String token = getValidAccessToken("user_alumni_tc25@example.com", "USER");

        webTestClient.get().uri("/api/articles/alumni-posts/published?organizationId=1&page=0&limit=10")
                .header("X-Forwarded-For", randomIp())
                .header("Authorization", "Bearer " + token)
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.data.items").isArray();
    }
    
    @Test
    @Order(26)
    void searchAlumniPosts_TC26_Success() {
        String token = getValidAccessToken("user_alumni_tc26@example.com", "USER");

        webTestClient.get().uri("/api/articles/alumni-posts/search?keyword=test&organizationId=1&page=0&limit=10")
                .header("X-Forwarded-For", randomIp())
                .header("Authorization", "Bearer " + token)
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.data.items").isArray();
    }

    // =========================================================================
    // AlumniPost Comment Tests (TC27 - TC31)
    // =========================================================================

    @Test
    @Order(27)
    void createComment_TC27_Success() {
        String adminEmail = "admin_alumni_tc27@example.com";
        String adminToken = getValidAccessToken(adminEmail, "ADMIN");
        
        String userEmail = "user_alumni_tc27@example.com";
        String userToken = getValidAccessToken(userEmail, "USER");
        Long userId = getUserIdByEmail(userEmail);

        // 1. Admin creates AlumniPost
        CreateAlumniPostRequest request = CreateAlumniPostRequest.builder()
                .organizationId(1)
                .title("AlumniPost for comment")
                .content("Content")
                .topic("alumni_profile")
                .build();

        Map<String, Object> response = webTestClient.post().uri("/api/articles/alumni-posts")
                .header("X-Forwarded-For", randomIp())
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .exchange()
                .expectStatus().isCreated()
                .expectBody(Map.class)
                .returnResult()
                .getResponseBody();

        Integer postId = (Integer) ((Map<String, Object>) response.get("data")).get("id");

        // 2. User comments
        CreateAlumniPostCommentRequest commentReq = new CreateAlumniPostCommentRequest();
        commentReq.setAlumniPostId(postId);
        commentReq.setAuthorMemberId(userId.intValue());
        commentReq.setContent("This is a great post!");

        webTestClient.post().uri("/api/articles/alumni-posts/" + postId + "/comments")
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
    @Order(28)
    void getComments_TC28_Success() {
        String adminEmail = "admin_alumni_tc28@example.com";
        String adminToken = getValidAccessToken(adminEmail, "ADMIN");
        
        String userEmail = "user_alumni_tc28@example.com";
        String userToken = getValidAccessToken(userEmail, "USER");
        Long userId = getUserIdByEmail(userEmail);

        // 1. Admin creates AlumniPost
        CreateAlumniPostRequest request = CreateAlumniPostRequest.builder()
                .organizationId(1)
                .title("AlumniPost for comment fetch")
                .content("Content")
                .topic("alumni_profile")
                .build();

        Map<String, Object> response = webTestClient.post().uri("/api/articles/alumni-posts")
                .header("X-Forwarded-For", randomIp())
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .exchange()
                .expectStatus().isCreated()
                .expectBody(Map.class)
                .returnResult()
                .getResponseBody();

        Integer postId = (Integer) ((Map<String, Object>) response.get("data")).get("id");

        // 2. User comments
        CreateAlumniPostCommentRequest commentReq = new CreateAlumniPostCommentRequest();
        commentReq.setAlumniPostId(postId);
        commentReq.setAuthorMemberId(userId.intValue());
        commentReq.setContent("First comment!");

        webTestClient.post().uri("/api/articles/alumni-posts/" + postId + "/comments")
                .header("X-Forwarded-For", randomIp())
                .header("Authorization", "Bearer " + userToken)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(commentReq)
                .exchange()
                .expectStatus().isCreated();

        // 3. Get comments
        webTestClient.get().uri("/api/articles/alumni-posts/" + postId + "/comments")
                .header("X-Forwarded-For", randomIp())
                .header("Authorization", "Bearer " + userToken)
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.data.items").isArray();
    }

    @Test
    @Order(29)
    void replyComment_TC29_Success() {
        String adminEmail = "admin_alumni_tc29@example.com";
        String adminToken = getValidAccessToken(adminEmail, "ADMIN");
        
        String userEmail1 = "user1_alumni_tc29@example.com";
        String userToken1 = getValidAccessToken(userEmail1, "USER");
        Long userId1 = getUserIdByEmail(userEmail1);
        
        String userEmail2 = "user2_alumni_tc29@example.com";
        String userToken2 = getValidAccessToken(userEmail2, "USER");
        Long userId2 = getUserIdByEmail(userEmail2);

        // 1. Admin creates AlumniPost
        CreateAlumniPostRequest request = CreateAlumniPostRequest.builder()
                .organizationId(1)
                .title("AlumniPost for reply")
                .content("Content")
                .topic("alumni_profile")
                .build();

        Map<String, Object> response = webTestClient.post().uri("/api/articles/alumni-posts")
                .header("X-Forwarded-For", randomIp())
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .exchange()
                .expectStatus().isCreated()
                .expectBody(Map.class)
                .returnResult()
                .getResponseBody();

        Integer postId = (Integer) ((Map<String, Object>) response.get("data")).get("id");

        // 2. User 1 comments
        CreateAlumniPostCommentRequest commentReq = new CreateAlumniPostCommentRequest();
        commentReq.setAlumniPostId(postId);
        commentReq.setAuthorMemberId(userId1.intValue());
        commentReq.setContent("Parent comment");

        Map<String, Object> commentResp = webTestClient.post().uri("/api/articles/alumni-posts/" + postId + "/comments")
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
        CreateAlumniPostCommentRequest replyReq = new CreateAlumniPostCommentRequest();
        replyReq.setAlumniPostId(postId);
        replyReq.setAuthorMemberId(userId2.intValue());
        replyReq.setContent("Reply to parent");

        webTestClient.post().uri("/api/articles/alumni-posts/" + postId + "/comments/" + parentCommentId + "/reply")
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
    @Order(30)
    void updateComment_TC30_Success() {
        String adminEmail = "admin_alumni_tc30@example.com";
        String adminToken = getValidAccessToken(adminEmail, "ADMIN");
        
        String userEmail = "user_alumni_tc30@example.com";
        String userToken = getValidAccessToken(userEmail, "USER");
        Long userId = getUserIdByEmail(userEmail);

        CreateAlumniPostRequest request = CreateAlumniPostRequest.builder()
                .organizationId(1)
                .title("AlumniPost to update comment")
                .content("Content")
                .topic("alumni_profile")
                .build();

        Map<String, Object> response = webTestClient.post().uri("/api/articles/alumni-posts")
                .header("X-Forwarded-For", randomIp())
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .exchange()
                .expectStatus().isCreated()
                .expectBody(Map.class)
                .returnResult()
                .getResponseBody();

        Integer postId = (Integer) ((Map<String, Object>) response.get("data")).get("id");

        CreateAlumniPostCommentRequest commentReq = new CreateAlumniPostCommentRequest();
        commentReq.setAlumniPostId(postId);
        commentReq.setAuthorMemberId(userId.intValue());
        commentReq.setContent("Original comment");

        Map<String, Object> commentResp = webTestClient.post().uri("/api/articles/alumni-posts/" + postId + "/comments")
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

        UpdateAlumniPostCommentRequest updateReq = new UpdateAlumniPostCommentRequest();
        updateReq.setContent("Updated comment");

        webTestClient.put().uri("/api/articles/alumni-posts/" + postId + "/comments/" + commentId)
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
    @Order(31)
    void deleteComment_TC31_Success() {
        String adminEmail = "admin_alumni_tc31@example.com";
        String adminToken = getValidAccessToken(adminEmail, "ADMIN");
        
        String userEmail = "user_alumni_tc31@example.com";
        String userToken = getValidAccessToken(userEmail, "USER");
        Long userId = getUserIdByEmail(userEmail);

        CreateAlumniPostRequest request = CreateAlumniPostRequest.builder()
                .organizationId(1)
                .title("AlumniPost to delete comment")
                .content("Content")
                .topic("alumni_profile")
                .build();

        Map<String, Object> response = webTestClient.post().uri("/api/articles/alumni-posts")
                .header("X-Forwarded-For", randomIp())
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .exchange()
                .expectStatus().isCreated()
                .expectBody(Map.class)
                .returnResult()
                .getResponseBody();

        Integer postId = (Integer) ((Map<String, Object>) response.get("data")).get("id");

        CreateAlumniPostCommentRequest commentReq = new CreateAlumniPostCommentRequest();
        commentReq.setAlumniPostId(postId);
        commentReq.setAuthorMemberId(userId.intValue());
        commentReq.setContent("Comment to delete");

        Map<String, Object> commentResp = webTestClient.post().uri("/api/articles/alumni-posts/" + postId + "/comments")
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

        webTestClient.delete().uri("/api/articles/alumni-posts/" + postId + "/comments/" + commentId)
                .header("X-Forwarded-For", randomIp())
                .header("Authorization", "Bearer " + userToken)
                .exchange()
                .expectStatus().isOk();
    }
}
