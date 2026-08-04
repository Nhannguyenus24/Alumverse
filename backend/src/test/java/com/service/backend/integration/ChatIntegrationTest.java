package com.service.backend.integration;

import com.service.backend.auth.dto.LoginRequest;
import com.service.backend.chat.dto.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.r2dbc.core.DatabaseClient;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Map;

@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class ChatIntegrationTest extends BaseIntegrationTest {

    @Autowired
    private DatabaseClient databaseClient;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private static final String TEST_PASSWORD = "Password123!";
    private static boolean dbInitialized = false;

    private static String user1Token, user2Token, user3Token;
    private static Long user1Id, user2Id, user3Id, user4Id;
    private static Integer testOrganizationId = 1;

    private static Long groupId;
    private static Long privateGroupId;
    private static Long conversationRequestId;

    @BeforeEach
    void setup() {
        if (!dbInitialized) {
            databaseClient.sql("DELETE FROM chat_messages").then().block();
            databaseClient.sql("DELETE FROM chat_group_members").then().block();
            databaseClient.sql("DELETE FROM chat_groups").then().block();
            databaseClient.sql("DELETE FROM user_blocks").then().block();
            databaseClient.sql("DELETE FROM chat_conversation_requests").then().block();
            
            user1Id = prepareUser("chat1@test.com", "User One");
            user2Id = prepareUser("chat2@test.com", "User Two");
            user3Id = prepareUser("chat3@test.com", "User Three");
            user4Id = prepareUser("chat4@test.com", "User Four");
            
            user1Token = getValidAccessToken("chat1@test.com");
            user2Token = getValidAccessToken("chat2@test.com");
            user3Token = getValidAccessToken("chat3@test.com");
            
            dbInitialized = true;
        }
    }

    private Long prepareUser(String email, String fullName) {
        String hash = passwordEncoder.encode(TEST_PASSWORD);
        databaseClient.sql("INSERT INTO users (email, password_hash, status, role, full_name, must_change_password) " +
                "VALUES (:email, :hash, 'ACTIVE', 'USER', :fullName, false) " +
                "ON CONFLICT (email) DO NOTHING")
                .bind("email", email)
                .bind("hash", hash)
                .bind("fullName", fullName)
                .then().block();

        Long userId = databaseClient.sql("SELECT id FROM users WHERE email = :email")
                .bind("email", email)
                .map((row, metadata) -> ((Number) row.get("id")).longValue())
                .one()
                .block();

        databaseClient.sql("INSERT INTO organization_members (organization_id, user_id, verification_level) " +
                "VALUES (1, :userId, 4) ON CONFLICT DO NOTHING")
                .bind("userId", userId)
                .then().block();

        return userId;
    }
    
    private Long getMemberId(Long userId) {
        return databaseClient.sql("SELECT id FROM organization_members WHERE user_id = :userId")
                .bind("userId", userId)
                .map((row, metadata) -> ((Number) row.get("id")).longValue())
                .one()
                .block();
    }

    private String getValidAccessToken(String email) {
        LoginRequest request = new LoginRequest();
        request.setOrganizationId(testOrganizationId);
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

    // --- NETWORK SEARCH ---

    @Test
    @Order(1)
    void searchNetworkMembers_success() {
        webTestClient.get()
                .uri("/api/chat/network/members")
                .header("Authorization", "Bearer " + user1Token)
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.data.items").isArray();
    }

    // --- CONVERSATION REQUESTS ---

    @Test
    @Order(2)
    void createConversationRequest_success() {
        CreateConversationRequestBody request = new CreateConversationRequestBody();
        request.setTargetMemberId(user2Id);
        request.setMessage("Hello, let's connect!");

        webTestClient.post()
                .uri("/api/chat/conversation-requests")
                .header("Authorization", "Bearer " + user1Token)
                .bodyValue(request)
                .exchange()
                .expectStatus().isCreated()
                .expectBody()
                .jsonPath("$.data").isNotEmpty();

        conversationRequestId = databaseClient.sql("SELECT id FROM chat_conversation_requests ORDER BY id DESC LIMIT 1")
                .fetch().first().map(m -> ((Number) m.get("id")).longValue()).block();
    }
    
    @Test
    @Order(3)
    void checkConnectionStatus_success() {
        webTestClient.get()
                .uri("/api/chat/conversation-requests/connection-status?targetMemberId=" + user2Id)
                .header("Authorization", "Bearer " + user1Token)
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.data.status").isEqualTo("PENDING");
    }

    @Test
    @Order(4)
    void searchIncomingRequests_success() {
        webTestClient.get()
                .uri("/api/chat/conversation-requests/search")
                .header("Authorization", "Bearer " + user2Token)
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.data.items").isArray();
    }

    @Test
    @Order(5)
    void respondToConversationRequest_success() {
        RespondConversationRequestBody request = new RespondConversationRequestBody();
        request.setId(conversationRequestId);
        request.setStatus("ACCEPTED");

        webTestClient.put()
                .uri("/api/chat/conversation-requests/respond")
                .header("Authorization", "Bearer " + user2Token)
                .bodyValue(request)
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.data.status").isEqualTo("ACCEPTED");

        privateGroupId = databaseClient.sql("SELECT id FROM chat_groups WHERE type = 'PRIVATE' ORDER BY id DESC LIMIT 1")
                .fetch().first().map(m -> ((Number) m.get("id")).longValue()).block();
    }

    // --- CONNECTIONS ---

    @Test
    @Order(6)
    void searchConnections_success() {
        webTestClient.get()
                .uri("/api/chat/connections/search")
                .header("Authorization", "Bearer " + user1Token)
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.data.items").isArray();
    }

    // --- PRIVATE CHAT (Via Connection) ---



    @Test
    @Order(8)
    void getPrivateChatList_success() {
        webTestClient.get()
                .uri("/api/chat/private/list")
                .header("Authorization", "Bearer " + user1Token)
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.data.items").isArray();
    }

    
    @Test
    @Order(10)
    void getPrivateChatStatus_success() {
        webTestClient.get()
                .uri("/api/chat/private/" + user2Id + "/status")
                .header("Authorization", "Bearer " + user1Token)
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.data.peerMemberId").isEqualTo(user2Id);
    }

    // --- GROUP CHAT ---

    @Test
    @Order(11)
    void createGroup_success() {
        CreateGroupRequest request = new CreateGroupRequest();
        request.setTitle("Dev Team");
        request.setMemberIds(List.of(user2Id, user3Id));

        webTestClient.post()
                .uri("/api/chat/groups")
                .header("Authorization", "Bearer " + user1Token)
                .bodyValue(request)
                .exchange()
                .expectStatus().isCreated()
                .expectBody()
                .jsonPath("$.data.id").isNotEmpty()
                .jsonPath("$.data.title").isEqualTo("Dev Team");

        groupId = databaseClient.sql("SELECT id FROM chat_groups WHERE type = 'GROUP' ORDER BY id DESC LIMIT 1")
                .fetch().first().map(m -> ((Number) m.get("id")).longValue()).block();
    }

    @Test
    @Order(12)
    void getGroupList_success() {
        webTestClient.get()
                .uri("/api/chat/groups")
                .header("Authorization", "Bearer " + user1Token)
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.data.items").isArray();
    }

    @Test
    @Order(13)
    void getGroupInfo_success() {
        webTestClient.get()
                .uri("/api/chat/groups/" + groupId + "/info")
                .header("Authorization", "Bearer " + user1Token)
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.data.title").isEqualTo("Dev Team");
    }

    @Test
    @Order(14)
    void updateGroupInfo_success() {
        UpdateGroupRequest request = new UpdateGroupRequest();
        request.setTitle("Dev Team Updated");

        webTestClient.put()
                .uri("/api/chat/groups/" + groupId)
                .header("Authorization", "Bearer " + user1Token)
                .bodyValue(request)
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.data.title").isEqualTo("Dev Team Updated");
    }

    @Test
    @Order(15)
    void addGroupMembers_success() {
        AddMembersRequest request = new AddMembersRequest();
        request.setMemberIds(List.of(user4Id));

        webTestClient.post()
                .uri("/api/chat/groups/" + groupId + "/members")
                .header("Authorization", "Bearer " + user1Token)
                .bodyValue(request)
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.message").isEqualTo("Members added successfully");
    }

    @Test
    @Order(16)
    void getGroupMembers_success() {
        webTestClient.get()
                .uri("/api/chat/groups/" + groupId + "/members")
                .header("Authorization", "Bearer " + user1Token)
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.data.items").isArray();
    }

    @Test
    @Order(17)
    void removeGroupMember_success() {
        webTestClient.delete()
                .uri("/api/chat/groups/" + groupId + "/members/" + user4Id)
                .header("Authorization", "Bearer " + user1Token)
                .exchange()
                .expectStatus().isOk();
    }

    @Test
    @Order(18)
    void leaveGroup_success() {
        webTestClient.delete()
                .uri("/api/chat/groups/" + groupId + "/leave")
                .header("Authorization", "Bearer " + user2Token)
                .exchange()
                .expectStatus().isOk();
    }
    
    @Test
    @Order(19)
    void getMessages_success() {
        webTestClient.get()
                .uri("/api/chat/groups/" + groupId + "/messages")
                .header("Authorization", "Bearer " + user1Token)
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.data").isArray();
    }

    // --- RECENT PREVIEWS ---

    @Test
    @Order(20)
    void getRecentPreviews_success() {
        webTestClient.get()
                .uri("/api/chat/recent-previews")
                .header("Authorization", "Bearer " + user1Token)
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.data").isArray();
    }

    // --- USER BLOCKS ---

    @Test
    @Order(21)
    void blockUser_success() {
        webTestClient.post()
                .uri("/api/chat/blocks/" + user2Id)
                .header("Authorization", "Bearer " + user1Token)
                .exchange()
                .expectStatus().isCreated()
                .expectBody()
                .jsonPath("$.data.blockedMemberId").isEqualTo(user2Id);
    }

    @Test
    @Order(22)
    void searchBlockedMembers_success() {
        webTestClient.get()
                .uri("/api/chat/blocks")
                .header("Authorization", "Bearer " + user1Token)
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.data.items").isArray();
    }

    @Test
    @Order(23)
    void getBlockStatus_success() {
        webTestClient.get()
                .uri("/api/chat/blocks/" + user2Id)
                .header("Authorization", "Bearer " + user1Token)
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.data.blocked").isEqualTo(true);
    }
    
    @Test
    @Order(24)
    void getBlockedMembersContext_success() {
        webTestClient.get()
                .uri("/api/chat/groups/" + groupId + "/blocked-members-context")
                .header("Authorization", "Bearer " + user1Token)
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.data.blockedMembers").isArray();
    }

    @Test
    @Order(25)
    void unblockUser_success() {
        webTestClient.delete()
                .uri("/api/chat/blocks/" + user2Id)
                .header("Authorization", "Bearer " + user1Token)
                .exchange()
                .expectStatus().isOk();
    }

    // --- DELETE GROUP ---

    @Test
    @Order(26)
    void deleteGroup_success() {
        webTestClient.delete()
                .uri("/api/chat/groups/" + groupId)
                .header("Authorization", "Bearer " + user1Token)
                .exchange()
                .expectStatus().isOk();
    }
}
