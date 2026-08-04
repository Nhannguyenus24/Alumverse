package com.service.backend.integration;

import com.service.backend.auth.dto.LoginRequest;
import com.service.backend.auth.dto.RegisterRequest;
import com.service.backend.mentorship.dto.BookSessionRequest;
import com.service.backend.mentorship.dto.CreateMentorProfileRequest;
import com.service.backend.mentorship.dto.UpdateMentorProfileRequest;
import com.service.backend.mentorship.dto.CreateExpertiseRequest;
import com.service.backend.mentorship.dto.UpdateExpertiseRequest;
import com.service.backend.mentorship.dto.CreateAvailabilityRequest;
import com.service.backend.shared.dto.CvExtractionResponse;
import com.service.backend.mentorship.dto.ExtractCvRequest;
import com.service.backend.mentorship.dto.UpdateMeetingLinkRequest;
import com.service.backend.mentorship.dto.UpdateSessionStatusRequest;
import com.service.backend.shared.service.CvExtractionService;
import com.service.backend.shared.service.OCRService;
import com.service.backend.shared.service.SkillExtractionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.r2dbc.core.DatabaseClient;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class MentorshipIntegrationTest extends BaseIntegrationTest {

    @Autowired
    private DatabaseClient databaseClient;

    @MockitoBean
    private OCRService ocrService;

    @MockitoBean
    private CvExtractionService cvExtractionService;

    @MockitoBean
    private SkillExtractionService skillExtractionService;

    private static final String TEST_PASSWORD = "StrongPassword123!";

    private String randomIp() {
        return UUID.randomUUID().toString();
    }

    @BeforeEach
    void setUpMocks() {
        when(emailService.sendHtmlEmail(anyString(), anyString(), anyString(), any())).thenReturn(Mono.empty());
        
        when(ocrService.extractRawTextFromFile(anyString())).thenReturn(Mono.just("Mocked OCR Text"));
        
        CvExtractionResponse mockCvResponse = new CvExtractionResponse();
        mockCvResponse.setCurrentJobTitle("Mock Job");
        when(cvExtractionService.extractProfile(anyString())).thenReturn(mockCvResponse);
        
        com.service.backend.shared.dto.SkillTagsResponse mockSkillResult = new com.service.backend.shared.dto.SkillTagsResponse();
        mockSkillResult.setTags(List.of("Java", "Spring Boot"));
        when(skillExtractionService.extractTags(anyString())).thenReturn(mockSkillResult);
    }

    private Long prepareUser(String email, String role) {
        Long existingId = databaseClient.sql("SELECT id FROM users WHERE email = :email")
                .bind("email", email)
                .map((row, metadata) -> row.get("id", Integer.class).longValue())
                .one()
                .onErrorResume(e -> reactor.core.publisher.Mono.empty())
                .block();
        if (existingId != null) {
            return existingId;
        }

        RegisterRequest request = new RegisterRequest();
        request.setOrganizationId(1);
        request.setEmail(email);
        request.setFullName("User " + email);
        request.setPassword(TEST_PASSWORD);

        webTestClient.post().uri("/api/auth/register")
                .header("X-Forwarded-For", randomIp())
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .exchange()
                .expectStatus().isCreated();

        databaseClient.sql("UPDATE users SET status = 'ACTIVE', role = :role WHERE email = :email")
                .bind("role", role)
                .bind("email", email)
                .then().block();

        Long userId = databaseClient.sql("SELECT id FROM users WHERE email = :email")
                .bind("email", email)
                .map((row, metadata) -> row.get("id", Integer.class).longValue())
                .one()
                .block();

        databaseClient.sql("UPDATE organization_members SET verification_level = 4 WHERE user_id = :userId")
                .bind("userId", userId)
                .then().block();

        databaseClient.sql("INSERT INTO mentee_profiles (member_id, is_active) VALUES (:userId, true)")
                .bind("userId", userId)
                .then().block();

        return userId;
    }

    private String getValidAccessToken(String email, String role) {
        Long userId = prepareUser(email, role);
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
        return "";
    }
    
    private void prepareMentorProfile(Long memberId) {
        databaseClient.sql("INSERT INTO mentor_profiles (member_id, status, current_job_title) VALUES (:memberId, 'APPROVED', 'Senior Developer')")
                .bind("memberId", memberId)
                .then().block();
    }
    
    private void prepareMenteeProfile(Long memberId) {
        databaseClient.sql("INSERT INTO mentee_profiles (member_id, is_active) VALUES (:memberId, true)")
                .bind("memberId", memberId)
                .then().block();
    }
    
    private Integer createMentorAvailability(Long mentorId) {
        return databaseClient.sql("INSERT INTO mentor_availabilities (mentor_member_id, start_time, end_time, status) VALUES (:mentorId, :start, :end, 'AVAILABLE') RETURNING id")
                .bind("mentorId", mentorId)
                .bind("start", LocalDateTime.now().plusDays(1))
                .bind("end", LocalDateTime.now().plusDays(1).plusHours(1))
                .map((row, metadata) -> row.get("id", Integer.class))
                .one()
                .block();
    }

    // Nhóm 1: Tìm kiếm & Lọc Mentor (TC68 - TC69)
    @Test
    @Order(68)
    void getMentors_TC68_Success() {
        String token = getValidAccessToken("mentee68@example.com", "USER");
        webTestClient.get().uri("/api/mentorship/mentee/mentors")
                .header("X-Forwarded-For", randomIp())
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .exchange()
                .expectStatus().isOk();
    }

    @Test
    @Order(69)
    void filterMentors_TC69_Success() {
        String token = getValidAccessToken("mentee69@example.com", "USER");
        webTestClient.get().uri("/api/mentorship/mentee/mentors/filter?search=Dev")
                .header("X-Forwarded-For", randomIp())
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .exchange()
                .expectStatus().isOk();
    }

    // Nhóm 2: Trích xuất CV & Tạo Mentor Profile (TC70 - TC73)
    @Test
    @Order(70)
    void extractCv_TC70_Success() {
        String token = getValidAccessToken("user70@example.com", "USER");
        ExtractCvRequest req = new ExtractCvRequest();
        req.setOriginalFileName("my_cv.pdf");
        req.setBase64File("JVBERi0xLjQKJcOkw7zDtsOfCjIgMCBvYmoKPDwvTGVuZ3RoIDMgMCBSPj4Kc3RyZWFtCgplbmRzdHJlYW0KZW5kb2JqCgo="); // Dummy base64

        webTestClient.post().uri("/api/mentorship/cv/extract")
                .header("X-Forwarded-For", randomIp())
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(req)
                .exchange()
                .expectStatus().isOk();
    }

    @Test
    @Order(71)
    void extractCv_TC71_InvalidFormat() {
        String token = getValidAccessToken("user71@example.com", "USER");
        ExtractCvRequest req = new ExtractCvRequest();
        req.setOriginalFileName("my_cv.png"); // Invalid extension
        req.setBase64File("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="); 

        webTestClient.post().uri("/api/mentorship/cv/extract")
                .header("X-Forwarded-For", randomIp())
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(req)
                .exchange()
                .expectStatus().isBadRequest();
    }

    @Test
    @Order(72)
    void createMentorProfile_TC72_Success() {
        String token = getValidAccessToken("user72@example.com", "USER");
        CreateMentorProfileRequest req = CreateMentorProfileRequest.builder()
                .currentJobTitle("Software Engineer")
                .defaultMeetingLink("https://meet.google.com/abc-defg-hij")
                .build();

        webTestClient.post().uri("/api/mentorship/mentor/profile")
                .header("X-Forwarded-For", randomIp())
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(req)
                .exchange()
                .expectStatus().isCreated();
    }

    @Test
    @Order(73)
    void createMentorProfile_TC73_InvalidMeetingLink() {
        String token = getValidAccessToken("user73@example.com", "USER");
        CreateMentorProfileRequest req = CreateMentorProfileRequest.builder()
                .currentJobTitle("Software Engineer")
                .defaultMeetingLink("invalid-link") // Invalid meeting link format
                .build();

        webTestClient.post().uri("/api/mentorship/mentor/profile")
                .header("X-Forwarded-For", randomIp())
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(req)
                .exchange()
                .expectStatus().isBadRequest();
    }

    // Nhóm 3: Mentee Book Session & Check Conflict (TC74 - TC77)
    @Test
    @Order(74)
    void bookSession_TC74_Success() {
        Long mentorId = prepareUser("mentor74@example.com", "USER");
        prepareMentorProfile(mentorId);
        Integer availabilityId = createMentorAvailability(mentorId);
        
        String token = getValidAccessToken("mentee74@example.com", "USER");
        BookSessionRequest req = BookSessionRequest.builder()
                .availabilityId(availabilityId)
                .sessionType("CAREER")
                .introduction("Hello, I need career advice")
                .build();

        webTestClient.post().uri("/api/mentorship/mentee/sessions/book")
                .header("X-Forwarded-For", randomIp())
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(req)
                .exchange()
                .expectStatus().isCreated();
    }

    @Test
    @Order(75)
    void bookSession_TC75_InvalidAvailability() {
        String token = getValidAccessToken("mentee75@example.com", "USER");
        BookSessionRequest req = BookSessionRequest.builder()
                .availabilityId(999999)
                .sessionType("CAREER")
                .introduction("Hello")
                .build();

        webTestClient.post().uri("/api/mentorship/mentee/sessions/book")
                .header("X-Forwarded-For", randomIp())
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(req)
                .exchange()
                .expectStatus().isNotFound();
    }

    @Test
    @Order(76)
    void bookSession_TC76_Conflict() {
        Long mentorId = prepareUser("mentor76@example.com", "USER");
        prepareMentorProfile(mentorId);
        Integer availabilityId = createMentorAvailability(mentorId);
        
        // Mentee 1 books successfully
        String token1 = getValidAccessToken("mentee76_1@example.com", "USER");
        BookSessionRequest req = BookSessionRequest.builder()
                .availabilityId(availabilityId)
                .sessionType("CAREER")
                .introduction("Hello")
                .build();
        webTestClient.post().uri("/api/mentorship/mentee/sessions/book")
                .header("X-Forwarded-For", randomIp())
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token1)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(req)
                .exchange()
                .expectStatus().isCreated();
                
        // Mentee 2 tries to book the same availability
        String token2 = getValidAccessToken("mentee76_2@example.com", "USER");
        webTestClient.post().uri("/api/mentorship/mentee/sessions/book")
                .header("X-Forwarded-For", randomIp())
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token2)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(req)
                .exchange()
                .expectStatus().isBadRequest(); // Assuming conflict throws BadRequest or Conflict
    }

    @Test
    @Order(77)
    void checkConflict_TC77_Success() {
        Long mentorId = prepareUser("mentor77@example.com", "USER");
        prepareMentorProfile(mentorId);
        Integer availabilityId = createMentorAvailability(mentorId);
        
        String token = getValidAccessToken("mentee77@example.com", "USER");
        webTestClient.get().uri("/api/mentorship/mentee/sessions/check-conflict?availabilityId=" + availabilityId)
                .header("X-Forwarded-For", randomIp())
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .exchange()
                .expectStatus().isOk();
    }

    // Nhóm 4: Mentor xử lý Request (TC78 - TC81)
    @Test
    @Order(78)
    void updateSessionStatus_TC78_Success() {
        Long mentorId = prepareUser("mentor78@example.com", "USER");
        prepareMentorProfile(mentorId);
        Integer availabilityId = createMentorAvailability(mentorId);
        
        String menteeToken = getValidAccessToken("mentee78@example.com", "USER");
        BookSessionRequest bookReq = BookSessionRequest.builder()
                .availabilityId(availabilityId)
                .sessionType("CAREER")
                .introduction("Hello")
                .build();
                
        Map<String, Object> response = webTestClient.post().uri("/api/mentorship/mentee/sessions/book")
                .header("X-Forwarded-For", randomIp())
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + menteeToken)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(bookReq)
                .exchange()
                .expectStatus().isCreated()
                .expectBody(Map.class)
                .returnResult()
                .getResponseBody();
                
        Integer sessionId = (Integer) ((Map<String, Object>) response.get("data")).get("id");
        
        String mentorToken = getValidAccessToken("mentor78@example.com", "USER"); // Re-login mentor
        UpdateSessionStatusRequest updateReq = new UpdateSessionStatusRequest();
        updateReq.setStatus("COMPLETED");
        
        webTestClient.put().uri("/api/mentorship/mentor/sessions/" + sessionId + "/status")
                .header("X-Forwarded-For", randomIp())
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + mentorToken)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(updateReq)
                .exchange()
                .expectStatus().isOk();
    }

    @Test
    @Order(79)
    void updateSessionMeetingLink_TC79_Success() {
        Long mentorId = prepareUser("mentor79@example.com", "USER");
        prepareMentorProfile(mentorId);
        Integer availabilityId = createMentorAvailability(mentorId);
        
        String menteeToken = getValidAccessToken("mentee79@example.com", "USER");
        BookSessionRequest bookReq = BookSessionRequest.builder()
                .availabilityId(availabilityId)
                .sessionType("CAREER")
                .introduction("Hello")
                .build();
                
        Map<String, Object> response = webTestClient.post().uri("/api/mentorship/mentee/sessions/book")
                .header("X-Forwarded-For", randomIp())
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + menteeToken)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(bookReq)
                .exchange()
                .expectStatus().isCreated()
                .expectBody(Map.class)
                .returnResult()
                .getResponseBody();
                
        Integer sessionId = (Integer) ((Map<String, Object>) response.get("data")).get("id");
        
        String mentorToken = getValidAccessToken("mentor79@example.com", "USER");
        UpdateMeetingLinkRequest updateReq = new UpdateMeetingLinkRequest();
        updateReq.setMeetingLink("https://meet.google.com/xyz-abcd-efg");
        
        webTestClient.put().uri("/api/mentorship/mentor/sessions/" + sessionId + "/meeting-link")
                .header("X-Forwarded-For", randomIp())
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + mentorToken)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(updateReq)
                .exchange()
                .expectStatus().isOk();
    }

    @Test
    @Order(80)
    void cancelSessionByMentor_TC80_Success() {
        Long mentorId = prepareUser("mentor80@example.com", "USER");
        prepareMentorProfile(mentorId);
        Integer availabilityId = createMentorAvailability(mentorId);
        
        String menteeToken = getValidAccessToken("mentee80@example.com", "USER");
        BookSessionRequest bookReq = BookSessionRequest.builder()
                .availabilityId(availabilityId)
                .sessionType("CAREER")
                .introduction("Hello")
                .build();
                
        Map<String, Object> response = webTestClient.post().uri("/api/mentorship/mentee/sessions/book")
                .header("X-Forwarded-For", randomIp())
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + menteeToken)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(bookReq)
                .exchange()
                .expectStatus().isCreated()
                .expectBody(Map.class)
                .returnResult()
                .getResponseBody();
                
        Integer sessionId = (Integer) ((Map<String, Object>) response.get("data")).get("id");
        
        String mentorToken = getValidAccessToken("mentor80@example.com", "USER");
        
        webTestClient.post().uri("/api/mentorship/mentor/sessions/" + sessionId + "/cancel?cancelReason=Emergency")
                .header("X-Forwarded-For", randomIp())
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + mentorToken)
                .exchange()
                .expectStatus().isOk();
    }

    @Test
    @Order(81)
    void cancelSessionByMentee_TC81_Success() {
        Long mentorId = prepareUser("mentor81@example.com", "USER");
        prepareMentorProfile(mentorId);
        Integer availabilityId = createMentorAvailability(mentorId);
        
        String menteeToken = getValidAccessToken("mentee81@example.com", "USER");
        BookSessionRequest bookReq = BookSessionRequest.builder()
                .availabilityId(availabilityId)
                .sessionType("CAREER")
                .introduction("Hello")
                .build();
                
        Map<String, Object> response = webTestClient.post().uri("/api/mentorship/mentee/sessions/book")
                .header("X-Forwarded-For", randomIp())
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + menteeToken)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(bookReq)
                .exchange()
                .expectStatus().isCreated()
                .expectBody(Map.class)
                .returnResult()
                .getResponseBody();
                
        Integer sessionId = (Integer) ((Map<String, Object>) response.get("data")).get("id");
        
        webTestClient.post().uri("/api/mentorship/mentee/sessions/" + sessionId + "/cancel?cancelReason=Schedule change")
                .header("X-Forwarded-For", randomIp())
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + menteeToken)
                .exchange()
                .expectStatus().isOk();
    }

    // Nhóm 5: Lấy danh sách Session (TC82)
    @Test
    @Order(82)
    void getSessions_TC82_Success() {
        String menteeToken = getValidAccessToken("mentee82@example.com", "USER");
        
        webTestClient.get().uri("/api/mentorship/mentee/sessions")
                .header("X-Forwarded-For", randomIp())
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + menteeToken)
                .exchange()
                .expectStatus().isOk();
                
        String mentorToken = getValidAccessToken("mentor82@example.com", "USER");
        
        webTestClient.get().uri("/api/mentorship/mentor/sessions")
                .header("X-Forwarded-For", randomIp())
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + mentorToken)
                .exchange()
                .expectStatus().isOk();
    }

    // Nhóm 0: Tạo Mentor Profile (TC49 - TC52)
    @Test
    @Order(49)
    void saveDraft_TC49_Success() {
        String token = getValidAccessToken("mentor49@example.com", "USER");
        CreateMentorProfileRequest req = CreateMentorProfileRequest.builder()
                .currentJobTitle("Draft Developer")
                .currentCompany("Draft Corp")
                .build();
        
        webTestClient.post().uri("/api/mentorship/mentor/profile/draft")
                .header("X-Forwarded-For", randomIp())
                .header(org.springframework.http.HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                .bodyValue(req)
                .exchange()
                .expectStatus().isOk();
    }

    @Test
    @Order(50)
    void createProfile_TC50_Success() {
        String token = getValidAccessToken("mentor50@example.com", "USER");
        CreateMentorProfileRequest req = CreateMentorProfileRequest.builder()
                .currentJobTitle("Senior Developer")
                .currentCompany("Tech Corp")
                .expertiseTags(java.util.List.of("Java", "Spring"))
                .build();
        
        webTestClient.post().uri("/api/mentorship/mentor/profile")
                .header("X-Forwarded-For", randomIp())
                .header(org.springframework.http.HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                .bodyValue(req)
                .exchange()
                .expectStatus().isCreated();
    }

    @Test
    @Order(51)
    void updateProfile_TC51_Success() {
        Long mentorId = prepareUser("mentor51@example.com", "USER");
        prepareMentorProfile(mentorId);
        String token = getValidAccessToken("mentor51@example.com", "USER");
        
        UpdateMentorProfileRequest req = UpdateMentorProfileRequest.builder()
                .currentJobTitle("Lead Developer")
                .build();
                
        webTestClient.put().uri("/api/mentorship/mentor/profile")
                .header("X-Forwarded-For", randomIp())
                .header(org.springframework.http.HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                .bodyValue(req)
                .exchange()
                .expectStatus().isOk();
    }

    @Test
    @Order(52)
    void getMyProfile_TC52_Success() {
        Long mentorId = prepareUser("mentor52@example.com", "USER");
        prepareMentorProfile(mentorId);
        String token = getValidAccessToken("mentor52@example.com", "USER");
        
        webTestClient.get().uri("/api/mentorship/mentor/profile")
                .header("X-Forwarded-For", randomIp())
                .header(org.springframework.http.HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .exchange()
                .expectStatus().isOk();
    }

    // Nhóm 1: Mentor Expertise (TC53 - TC56)
    @Test
    @Order(53)
    void addExpertise_TC53_Success() {
        Long mentorId = prepareUser("mentor53@example.com", "USER");
        prepareMentorProfile(mentorId);
        String token = getValidAccessToken("mentor53@example.com", "USER");
        
        CreateExpertiseRequest req = CreateExpertiseRequest.builder()
                .topic("System Design")
                .yearsExperience(5)
                .build();
                
        webTestClient.post().uri("/api/mentorship/mentor/expertise")
                .header("X-Forwarded-For", randomIp())
                .header(org.springframework.http.HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                .bodyValue(req)
                .exchange()
                .expectStatus().isCreated();
    }

    @Test
    @Order(54)
    void getMyExpertise_TC54_Success() {
        Long mentorId = prepareUser("mentor54@example.com", "USER");
        prepareMentorProfile(mentorId);
        String token = getValidAccessToken("mentor54@example.com", "USER");
        
        webTestClient.get().uri("/api/mentorship/mentor/expertise")
                .header("X-Forwarded-For", randomIp())
                .header(org.springframework.http.HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .exchange()
                .expectStatus().isOk();
    }

    @Test
    @Order(55)
    void updateExpertise_TC55_Success() {
        Long mentorId = prepareUser("mentor55@example.com", "USER");
        prepareMentorProfile(mentorId);
        String token = getValidAccessToken("mentor55@example.com", "USER");
        
        // Add one first
        CreateExpertiseRequest createReq = CreateExpertiseRequest.builder()
                .topic("Backend")
                .yearsExperience(2)
                .build();
                
        java.util.Map<String, Object> response = webTestClient.post().uri("/api/mentorship/mentor/expertise")
                .header("X-Forwarded-For", randomIp())
                .header(org.springframework.http.HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                .bodyValue(createReq)
                .exchange()
                .expectStatus().isCreated()
                .expectBody(java.util.Map.class)
                .returnResult()
                .getResponseBody();
                
        Integer id = (Integer) ((java.util.Map<String, Object>) response.get("data")).get("id");
        
        UpdateExpertiseRequest updateReq = UpdateExpertiseRequest.builder()
                .topic("Backend Updated")
                .yearsExperience(3)
                .build();
                
        webTestClient.put().uri("/api/mentorship/mentor/expertise/" + id)
                .header("X-Forwarded-For", randomIp())
                .header(org.springframework.http.HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                .bodyValue(updateReq)
                .exchange()
                .expectStatus().isOk();
    }

    @Test
    @Order(56)
    void deleteExpertise_TC56_Success() {
        Long mentorId = prepareUser("mentor56@example.com", "USER");
        prepareMentorProfile(mentorId);
        String token = getValidAccessToken("mentor56@example.com", "USER");
        
        CreateExpertiseRequest createReq = CreateExpertiseRequest.builder()
                .topic("Frontend")
                .yearsExperience(2)
                .build();
                
        java.util.Map<String, Object> response = webTestClient.post().uri("/api/mentorship/mentor/expertise")
                .header("X-Forwarded-For", randomIp())
                .header(org.springframework.http.HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                .bodyValue(createReq)
                .exchange()
                .expectStatus().isCreated()
                .expectBody(java.util.Map.class)
                .returnResult()
                .getResponseBody();
                
        Integer id = (Integer) ((java.util.Map<String, Object>) response.get("data")).get("id");
        
        webTestClient.delete().uri("/api/mentorship/mentor/expertise/" + id)
                .header("X-Forwarded-For", randomIp())
                .header(org.springframework.http.HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .exchange()
                .expectStatus().isOk();
    }

    // Nhóm 2: Mentor Availability (TC57 - TC67)
    @Test
    @Order(57)
    void addAvailability_TC57_Success() {
        Long mentorId = prepareUser("mentor57@example.com", "USER");
        prepareMentorProfile(mentorId);
        String token = getValidAccessToken("mentor57@example.com", "USER");
        
        CreateAvailabilityRequest req = CreateAvailabilityRequest.builder()
                .startTime(java.time.LocalDateTime.now().plusDays(2))
                .endTime(java.time.LocalDateTime.now().plusDays(2).plusHours(1))
                .build();
                
        webTestClient.post().uri("/api/mentorship/mentor/availability")
                .header("X-Forwarded-For", randomIp())
                .header(org.springframework.http.HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                .bodyValue(req)
                .exchange()
                .expectStatus().isCreated();
    }

    @Test
    @Order(58)
    void addAvailability_TC58_InvalidTime() {
        Long mentorId = prepareUser("mentor58@example.com", "USER");
        prepareMentorProfile(mentorId);
        String token = getValidAccessToken("mentor58@example.com", "USER");
        
        CreateAvailabilityRequest req = CreateAvailabilityRequest.builder()
                .startTime(java.time.LocalDateTime.now().minusDays(1)) // Past time
                .endTime(java.time.LocalDateTime.now().plusHours(1))
                .build();
                
        webTestClient.post().uri("/api/mentorship/mentor/availability")
                .header("X-Forwarded-For", randomIp())
                .header(org.springframework.http.HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                .bodyValue(req)
                .exchange()
                .expectStatus().isBadRequest();
    }

    @Test
    @Order(59)
    void addAvailability_TC59_Conflict() {
        Long mentorId = prepareUser("mentor59@example.com", "USER");
        prepareMentorProfile(mentorId);
        String token = getValidAccessToken("mentor59@example.com", "USER");
        
        java.time.LocalDateTime start = java.time.LocalDateTime.now().plusDays(3);
        java.time.LocalDateTime end = start.plusHours(2);
        
        CreateAvailabilityRequest req1 = CreateAvailabilityRequest.builder()
                .startTime(start)
                .endTime(end)
                .build();
                
        webTestClient.post().uri("/api/mentorship/mentor/availability")
                .header("X-Forwarded-For", randomIp())
                .header(org.springframework.http.HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                .bodyValue(req1)
                .exchange()
                .expectStatus().isCreated();
                
        // Conflict req
        CreateAvailabilityRequest req2 = CreateAvailabilityRequest.builder()
                .startTime(start.plusHours(1))
                .endTime(end.plusHours(1))
                .build();
                
        webTestClient.post().uri("/api/mentorship/mentor/availability")
                .header("X-Forwarded-For", randomIp())
                .header(org.springframework.http.HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                .bodyValue(req2)
                .exchange()
                .expectStatus().isEqualTo(409);
    }

    @Test
    @Order(60)
    void getMyAvailabilities_TC60_Success() {
        Long mentorId = prepareUser("mentor60@example.com", "USER");
        prepareMentorProfile(mentorId);
        String token = getValidAccessToken("mentor60@example.com", "USER");
        
        webTestClient.get().uri("/api/mentorship/mentor/availability")
                .header("X-Forwarded-For", randomIp())
                .header(org.springframework.http.HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .exchange()
                .expectStatus().isOk();
    }

    @Test
    @Order(61)
    void updateAvailability_TC61_Success() {
        Long mentorId = prepareUser("mentor61@example.com", "USER");
        prepareMentorProfile(mentorId);
        String token = getValidAccessToken("mentor61@example.com", "USER");
        
        java.time.LocalDateTime start = java.time.LocalDateTime.now().plusDays(4);
        java.time.LocalDateTime end = start.plusHours(2);
        
        CreateAvailabilityRequest createReq = CreateAvailabilityRequest.builder()
                .startTime(start)
                .endTime(end)
                .build();
                
        java.util.Map<String, Object> response = webTestClient.post().uri("/api/mentorship/mentor/availability")
                .header("X-Forwarded-For", randomIp())
                .header(org.springframework.http.HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                .bodyValue(createReq)
                .exchange()
                .expectStatus().isCreated()
                .expectBody(java.util.Map.class)
                .returnResult()
                .getResponseBody();
                
        Integer id = (Integer) ((java.util.Map<String, Object>) response.get("data")).get("id");
        
        CreateAvailabilityRequest updateReq = CreateAvailabilityRequest.builder()
                .startTime(start.plusHours(1))
                .endTime(end.plusHours(1))
                .build();
                
        webTestClient.put().uri("/api/mentorship/mentor/availability/" + id)
                .header("X-Forwarded-For", randomIp())
                .header(org.springframework.http.HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                .bodyValue(updateReq)
                .exchange()
                .expectStatus().isOk();
    }

    @Test
    @Order(62)
    void updateAvailability_TC62_Conflict() {
        Long mentorId = prepareUser("mentor62@example.com", "USER");
        prepareMentorProfile(mentorId);
        String token = getValidAccessToken("mentor62@example.com", "USER");
        
        java.time.LocalDateTime start1 = java.time.LocalDateTime.now().plusDays(5);
        java.time.LocalDateTime end1 = start1.plusHours(1);
        
        CreateAvailabilityRequest req1 = CreateAvailabilityRequest.builder()
                .startTime(start1)
                .endTime(end1)
                .build();
                
        webTestClient.post().uri("/api/mentorship/mentor/availability")
                .header("X-Forwarded-For", randomIp())
                .header(org.springframework.http.HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                .bodyValue(req1)
                .exchange()
                .expectStatus().isCreated();
                
        java.time.LocalDateTime start2 = java.time.LocalDateTime.now().plusDays(6);
        java.time.LocalDateTime end2 = start2.plusHours(1);
        
        CreateAvailabilityRequest req2 = CreateAvailabilityRequest.builder()
                .startTime(start2)
                .endTime(end2)
                .build();
                
        java.util.Map<String, Object> response = webTestClient.post().uri("/api/mentorship/mentor/availability")
                .header("X-Forwarded-For", randomIp())
                .header(org.springframework.http.HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                .bodyValue(req2)
                .exchange()
                .expectStatus().isCreated()
                .expectBody(java.util.Map.class)
                .returnResult()
                .getResponseBody();
                
        Integer id2 = (Integer) ((java.util.Map<String, Object>) response.get("data")).get("id");
        
        // Try to update id2 to conflict with id1
        CreateAvailabilityRequest updateReq = CreateAvailabilityRequest.builder()
                .startTime(start1)
                .endTime(end1)
                .build();
                
        webTestClient.put().uri("/api/mentorship/mentor/availability/" + id2)
                .header("X-Forwarded-For", randomIp())
                .header(org.springframework.http.HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                .bodyValue(updateReq)
                .exchange()
                .expectStatus().isEqualTo(409);
    }

    @Test
    @Order(63)
    void deleteAvailability_TC63_Success() {
        Long mentorId = prepareUser("mentor63@example.com", "USER");
        prepareMentorProfile(mentorId);
        String token = getValidAccessToken("mentor63@example.com", "USER");
        
        CreateAvailabilityRequest createReq = CreateAvailabilityRequest.builder()
                .startTime(java.time.LocalDateTime.now().plusDays(7))
                .endTime(java.time.LocalDateTime.now().plusDays(7).plusHours(1))
                .build();
                
        java.util.Map<String, Object> response = webTestClient.post().uri("/api/mentorship/mentor/availability")
                .header("X-Forwarded-For", randomIp())
                .header(org.springframework.http.HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                .bodyValue(createReq)
                .exchange()
                .expectStatus().isCreated()
                .expectBody(java.util.Map.class)
                .returnResult()
                .getResponseBody();
                
        Integer id = (Integer) ((java.util.Map<String, Object>) response.get("data")).get("id");
        
        webTestClient.delete().uri("/api/mentorship/mentor/availability/" + id)
                .header("X-Forwarded-For", randomIp())
                .header(org.springframework.http.HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .exchange()
                .expectStatus().isOk();
    }

    @Test
    @Order(64)
    void addAvailability_TC64_MissingFields() {
        String token = getValidAccessToken("mentor64@example.com", "USER");
        CreateAvailabilityRequest req = new CreateAvailabilityRequest();
        
        webTestClient.post().uri("/api/mentorship/mentor/availability")
                .header("X-Forwarded-For", randomIp())
                .header(org.springframework.http.HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                .bodyValue(req)
                .exchange()
                .expectStatus().isBadRequest();
    }

    @Test
    @Order(65)
    void addAvailability_TC65_EndBeforeStart() {
        Long mentorId = prepareUser("mentor65@example.com", "USER");
        prepareMentorProfile(mentorId);
        String token = getValidAccessToken("mentor65@example.com", "USER");
        java.time.LocalDateTime start = java.time.LocalDateTime.now().plusDays(8);
        java.time.LocalDateTime end = start.minusHours(1); // End before start
        
        CreateAvailabilityRequest req = CreateAvailabilityRequest.builder()
                .startTime(start)
                .endTime(end)
                .build();
                
        webTestClient.post().uri("/api/mentorship/mentor/availability")
                .header("X-Forwarded-For", randomIp())
                .header(org.springframework.http.HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                .bodyValue(req)
                .exchange()
                .expectStatus().isBadRequest();
    }

    @Test
    @Order(66)
    void updateAvailability_TC66_NotFound() {
        Long mentorId = prepareUser("mentor66@example.com", "USER");
        prepareMentorProfile(mentorId);
        String token = getValidAccessToken("mentor66@example.com", "USER");
        
        CreateAvailabilityRequest req = CreateAvailabilityRequest.builder()
                .startTime(java.time.LocalDateTime.now().plusDays(9))
                .endTime(java.time.LocalDateTime.now().plusDays(9).plusHours(1))
                .build();
                
        webTestClient.put().uri("/api/mentorship/mentor/availability/999999")
                .header("X-Forwarded-For", randomIp())
                .header(org.springframework.http.HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                .bodyValue(req)
                .exchange()
                .expectStatus().isNotFound();
    }

    @Test
    @Order(67)
    void deleteAvailability_TC67_NotFound() {
        Long mentorId = prepareUser("mentor67@example.com", "USER");
        prepareMentorProfile(mentorId);
        String token = getValidAccessToken("mentor67@example.com", "USER");
        
        webTestClient.delete().uri("/api/mentorship/mentor/availability/999999")
                .header("X-Forwarded-For", randomIp())
                .header(org.springframework.http.HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .exchange()
                .expectStatus().isNotFound();
    }

}
