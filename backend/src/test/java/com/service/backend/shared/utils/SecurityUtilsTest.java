package com.service.backend.shared.utils;

import com.service.backend.shared.enums.ErrorCode;
import com.service.backend.shared.exception.ApplicationException;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import reactor.test.StepVerifier;
import reactor.util.context.Context;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

class SecurityUtilsTest {

    @Test
    void adminWithoutOrganizationCanManageAnyOrganization() {
        StepVerifier.create(SecurityUtils.assertSameOrganizationOrAdmin(10)
                        .contextWrite(authenticationContext("ADMIN", null)))
                .verifyComplete();
    }

    @Test
    void staffCanManageOwnOrganization() {
        StepVerifier.create(SecurityUtils.assertSameOrganizationOrAdmin(10)
                        .contextWrite(authenticationContext("STAFF", 10)))
                .verifyComplete();
    }

    @Test
    void staffCannotManageAnotherOrganization() {
        StepVerifier.create(SecurityUtils.assertSameOrganizationOrAdmin(20)
                        .contextWrite(authenticationContext("STAFF", 10)))
                .expectErrorSatisfies(error -> {
                    ApplicationException exception = (ApplicationException) error;
                    assertEquals(ErrorCode.FORBIDDEN, exception.getErrorCode());
                    assertEquals("You can only manage data in your own organization", exception.getMessage());
                })
                .verify();
    }

    @Test
    void unauthenticatedRequestIsRejected() {
        StepVerifier.create(SecurityUtils.assertSameOrganizationOrAdmin(10))
                .expectErrorSatisfies(error ->
                        assertEquals(ErrorCode.FORBIDDEN, ((ApplicationException) error).getErrorCode()))
                .verify();
    }

    private static Context authenticationContext(String role, Integer organizationId) {
        UsernamePasswordAuthenticationToken token = new UsernamePasswordAuthenticationToken(
                "1", null, List.of(new SimpleGrantedAuthority("ROLE_" + role)));
        token.setDetails(organizationId);
        return ReactiveSecurityContextHolder.withAuthentication(token);
    }
}
