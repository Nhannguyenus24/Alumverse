package com.service.backend.admin.service;

import com.service.backend.admin.dao.AdminAuditLogRepository;
import com.service.backend.admin.dao.AdminUserRepository;
import com.service.backend.shared.entity.OrganizationMember;
import com.service.backend.shared.entity.User;
import com.service.backend.shared.enums.ErrorCode;
import com.service.backend.shared.enums.UserRole;
import com.service.backend.shared.exception.ApplicationException;
import com.service.backend.shared.service.EmailService;
import com.service.backend.shared.service.SseService;
import com.service.backend.shared.utils.CacheUtils;
import com.service.backend.user.dao.PeerVerificationRepository;
import com.service.backend.user.dao.UserOrganizationMemberRepository;
import com.service.backend.user.dao.UserProfileRepository;
import com.service.backend.user.service.NotificationService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.List;

import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminUserServiceTest {

    @Mock private AdminUserRepository adminUserRepository;
    @Mock private AdminAuditLogRepository adminAuditLogRepository;
    @Mock private AdminAuditService adminAuditService;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private UserProfileRepository userProfileRepository;
    @Mock private UserOrganizationMemberRepository userOrganizationMemberRepository;
    @Mock private SseService sseService;
    @Mock private PeerVerificationRepository peerVerificationRepository;
    @Mock private NotificationService notificationService;
    @Mock private CacheUtils cacheUtils;
    @Mock private EmailService emailService;

    @InjectMocks private AdminUserService adminUserService;

    @Test
    void staffCannotAccessAdminAccount() {
        when(adminUserRepository.findById(9)).thenReturn(Mono.just(
                User.builder().id(9).role(UserRole.ADMIN).build()));

        StepVerifier.create(adminUserService.assertStaffCanAccessUser(9).contextWrite(staffContext(1)))
                .expectErrorMatches(error -> error instanceof ApplicationException
                        && ((ApplicationException) error).getErrorCode() == ErrorCode.FORBIDDEN)
                .verify();
    }

    @Test
    void staffCanAccessNonAdminInCurrentOrganization() {
        when(adminUserRepository.findById(2)).thenReturn(Mono.just(
                User.builder().id(2).role(UserRole.STAFF).build()));
        when(userOrganizationMemberRepository.findByOrganizationIdAndUserId(1, 2))
                .thenReturn(Mono.just(OrganizationMember.builder()
                        .organizationId(1).userId(2).build()));

        StepVerifier.create(adminUserService.assertStaffCanAccessUser(2).contextWrite(staffContext(1)))
                .verifyComplete();
    }

    @Test
    void staffCannotAccessUserOutsideCurrentOrganization() {
        when(adminUserRepository.findById(2)).thenReturn(Mono.just(
                User.builder().id(2).role(UserRole.USER).build()));
        when(userOrganizationMemberRepository.findByOrganizationIdAndUserId(1, 2))
                .thenReturn(Mono.empty());

        StepVerifier.create(adminUserService.assertStaffCanAccessUser(2).contextWrite(staffContext(1)))
                .expectErrorMatches(error -> error instanceof ApplicationException
                        && ((ApplicationException) error).getErrorCode() == ErrorCode.FORBIDDEN)
                .verify();
    }

    private static reactor.util.context.Context staffContext(Integer organizationId) {
        var authentication = new UsernamePasswordAuthenticationToken(
                "1", null, List.of(new SimpleGrantedAuthority("ROLE_STAFF")));
        authentication.setDetails(organizationId);
        return org.springframework.security.core.context.ReactiveSecurityContextHolder
                .withAuthentication(authentication);
    }
}
