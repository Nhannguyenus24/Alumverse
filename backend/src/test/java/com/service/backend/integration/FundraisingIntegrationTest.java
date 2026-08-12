package com.service.backend.integration;

import com.service.backend.auth.dto.LoginRequest;
import com.service.backend.fundraising.dto.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.r2dbc.core.DatabaseClient;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;

@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class FundraisingIntegrationTest extends BaseIntegrationTest {

    @Autowired
    private DatabaseClient databaseClient;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private static final String TEST_PASSWORD = "Password123!";
    private static boolean dbInitialized = false;

    private static String adminToken;
    private static String userToken;
    private static Long adminUserId;
    private static Long testUserId;
    private static Integer testOrganizationId = 1;
    private static Integer receivingInfoId;
    private static Integer fundId;

    @BeforeEach
    void setup() {
        if (!dbInitialized) {
            databaseClient.sql("DELETE FROM fund_donations").then().block();
            databaseClient.sql("DELETE FROM funds").then().block();
            databaseClient.sql("DELETE FROM fund_receiving_infos").then().block();
            
            adminUserId = prepareUser("fundadmin@test.com", "ADMIN");
            adminToken = getValidAccessToken("fundadmin@test.com", "ADMIN");
            
            testUserId = prepareUser("funduser@test.com", "USER");
            userToken = getValidAccessToken("funduser@test.com", "USER");
            
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
                .bind("fullName", "Fund User")
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

    // --- RECEIVING INFO TESTS ---

    @Test
    @Order(1)
    void createReceivingInfo_success() {
        CreateFundReceivingInfosRequest request = new CreateFundReceivingInfosRequest();
        request.setBankName("MB");
        request.setAccountName("QUY KHUYEN HOC");
        request.setAccountNumber("0123456789");

        webTestClient.post()
                .uri("/api/funds/receiving-infos")
                .header("Authorization", "Bearer " + adminToken)
                .bodyValue(request)
                .exchange()
                .expectStatus().isCreated()
                .expectBody()
                .jsonPath("$.data.id").isNotEmpty()
                .jsonPath("$.data.bankName").isEqualTo("MB");
                
        receivingInfoId = databaseClient.sql("SELECT id FROM fund_receiving_infos LIMIT 1")
                .fetch().first().map(m -> ((Number) m.get("id")).intValue()).block();
    }

    @Test
    @Order(2)
    void getReceivingInfos_success() {
        webTestClient.get()
                .uri("/api/funds/receiving-infos")
                .header("Authorization", "Bearer " + adminToken)
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.data.items").isArray();
    }

    @Test
    @Order(3)
    void getActiveReceivingInfos_success() {
        webTestClient.get()
                .uri("/api/funds/receiving-infos/active")
                .header("Authorization", "Bearer " + adminToken)
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.data").isArray();
    }

    // --- FUND TESTS ---

    @Test
    @Order(4)
    void getSupportedBanks_success() {
        webTestClient.get()
                .uri("/api/funds/banks")
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.data.banks").isArray();
    }

    @Test
    @Order(5)
    void createFund_success() {
        CreateFundRequest request = new CreateFundRequest();
        request.setName("Quỹ học bổng 2026");
        request.setDescriptionShort("Hỗ trợ sinh viên khó khăn");
        request.setDescriptionFull("Mô tả chi tiết quỹ học bổng...");
        request.setManagerName("Nguyễn Văn A");
        request.setManagerEmail("nguyenvana@test.com");
        request.setOrganizationId(testOrganizationId);
        request.setFundReceivingInfoId(receivingInfoId);
        request.setTargetAmount(new BigDecimal("10000000"));
        request.setTimeStarted(LocalDateTime.now().minusDays(1));
        request.setTimeEnded(LocalDateTime.now().plusDays(30));
        request.setTopic("Học bổng");

        webTestClient.post()
                .uri("/api/funds")
                .header("Authorization", "Bearer " + adminToken)
                .bodyValue(request)
                .exchange()
                .expectStatus().isCreated()
                .expectBody()
                .jsonPath("$.data.id").isNotEmpty()
                .jsonPath("$.data.name").isEqualTo("Quỹ học bổng 2026");

        fundId = databaseClient.sql("SELECT id FROM funds ORDER BY id DESC LIMIT 1")
                .fetch().first().map(m -> ((Number) m.get("id")).intValue()).block();
    }

    @Test
    @Order(6)
    void getAllFunds_success() {
        webTestClient.get()
                .uri("/api/funds?organizationId=" + testOrganizationId)
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.data.data.featured.name").isEqualTo("Quỹ học bổng 2026")
                .jsonPath("$.data.data.items").isEmpty()
                .jsonPath("$.data.data.totalItem").isEqualTo(0)
                .jsonPath("$.data.data.totalPage").isEqualTo(0);
    }

    @Test
    @Order(7)
    void getFundDetail_success() {
        webTestClient.get()
                .uri("/api/funds/" + fundId)
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.data.name").isEqualTo("Quỹ học bổng 2026");
    }

    @Test
    @Order(8)
    void updateFundBasicInfo_success() {
        UpdateFundBasicInfoRequest request = new UpdateFundBasicInfoRequest();
        request.setManagerName("Nguyễn Văn B");
        request.setManagerEmail("nguyenvanb@test.com");
        request.setDescriptionFull("Update mô tả...");

        webTestClient.patch()
                .uri("/api/funds/" + fundId + "/basic-info")
                .header("Authorization", "Bearer " + adminToken)
                .bodyValue(request)
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.data.managerName").isEqualTo("Nguyễn Văn B");
    }

    @Test
    @Order(9)
    void updateDonationVisibility_success() {
        UpdateFundDonationVisibilityRequest request = new UpdateFundDonationVisibilityRequest();
        request.setIsPublic(true);

        webTestClient.put()
                .uri("/api/funds/" + fundId + "/donation-visibility")
                .header("Authorization", "Bearer " + adminToken)
                .bodyValue(request)
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.data.donationListPublic").isEqualTo(true);
    }

    @Test
    @Order(10)
    void getStatistics_success() {
        webTestClient.get()
                .uri("/api/funds/statistics")
                .header("Authorization", "Bearer " + adminToken)
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.data.totalFunds").isNumber();
    }

    // --- DONATION TESTS ---

    @Test
    @Order(11)
    void createDonation_success() {
        CreateFundDonationRequest request = new CreateFundDonationRequest();
        request.setFundId(fundId);
        request.setDonorMemberId(testUserId.intValue());
        request.setDonorName("Người ủng hộ 1");
        request.setAmount(new BigDecimal("500000"));
        request.setAddress("TP HCM");
        request.setPhone("0987654321");
        request.setEmail("donor1@test.com");
        request.setMessage("Của ít lòng nhiều");

        webTestClient.post()
                .uri("/api/fund-donations")
                .header("Authorization", "Bearer " + userToken)
                .bodyValue(request)
                .exchange()
                .expectStatus().isCreated()
                .expectBody()
                .jsonPath("$.data.checkoutUrl").isNotEmpty();
    }

    @Test
    @Order(12)
    void getDonations_success() {
        webTestClient.get()
                .uri("/api/fund-donations/" + fundId)
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.data.items").isArray();
    }

    @Test
    @Order(13)
    void getDonationsByUserId_success() {
        webTestClient.get()
                .uri("/api/fund-donations/user/" + testUserId)
                .header("Authorization", "Bearer " + userToken)
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.data.items").isArray();
    }

    // --- CLOSE FUND ---

    @Test
    @Order(14)
    void closeFund_success() {
        webTestClient.put()
                .uri("/api/funds/" + fundId + "/close")
                .header("Authorization", "Bearer " + adminToken)
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.message").isNotEmpty();
    }
}
