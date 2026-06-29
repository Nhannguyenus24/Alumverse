package com.service.backend.config;

import com.service.backend.shared.annotations.PublicEndpoint;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.config.BeanDefinition;
import org.springframework.context.annotation.ClassPathScanningCandidateComponentProvider;
import org.springframework.core.type.filter.AnnotationTypeFilter;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.lang.reflect.Method;
import java.util.Set;
import java.util.TreeSet;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Security regression guard for authentication exposure.
 *
 * <p>Every non-public HTTP endpoint is JWT-protected by default via
 * {@code SecurityConfig.anyExchange().authenticated()}. The only way to expose an endpoint
 * without authentication is the {@link PublicEndpoint} annotation. This test pins the exact
 * set of public endpoints: if anyone adds or removes a {@code @PublicEndpoint} (or marks a
 * whole controller public), this test fails until {@link #EXPECTED_PUBLIC_ENDPOINTS} is
 * updated — forcing a deliberate security review of the change.
 *
 * <p>The scan mirrors the production logic in {@code PublicEndpointConfig}: an endpoint is
 * public if its handler method OR its declaring controller is annotated {@code @PublicEndpoint}.
 */
class PublicEndpointGuardTest {

    private static final String BASE_PACKAGE = "com.service.backend";

    /**
     * Handler methods intentionally reachable WITHOUT a JWT, keyed by
     * {@code SimpleControllerName#methodName}. Keep alphabetically sorted.
     * DO NOT add an entry without confirming the endpoint is safe to expose anonymously.
     */
    private static final Set<String> EXPECTED_PUBLIC_ENDPOINTS = new TreeSet<>(Set.of(
            // Public content reads (articles)
            "AchievementController#getAll",
            "AchievementController#getById",
            "AchievementController#getByMemberId",
            "AchievementController#getByStatus",
            "AchievementController#search",
            "AlumniPostController#getAll",
            "AlumniPostController#getById",
            "AlumniPostController#getBySlug",
            "AlumniPostController#getByUserId",
            "AlumniPostController#getPublished",
            "AlumniPostController#search",
            "JobController#getActive",
            "JobController#getAll",
            "JobController#getById",
            "JobController#getOpenJobs",
            "JobController#search",
            "LearningResourceController#getAll",
            "LearningResourceController#getById",
            "LearningResourceController#getByType",
            "LearningResourceController#search",
            "NewsController#getAll",
            "NewsController#getById",
            "NewsController#getBySlug",
            "NewsController#getPublished",
            "NewsController#search",
            // Auth (pre-authentication flows only)
            "AuthController#activateUser",
            "AuthController#googleLogin",
            "AuthController#login",
            "AuthController#logout",
            "AuthController#refresh",
            "AuthController#register",
            "AuthController#sendOtp",
            "AuthController#verifyOtp",
            // Public event reads
            "EventController#getEventById",
            "EventController#getEventQuestions",
            "EventController#getEvents",
            "EventController#getPastEvents",
            "EventController#getUpcomingEvents",
            "EventController#searchEvents",
            // Public forum reads
            "ForumController#getAllCategoriesByOrganization",
            "ForumController#getCategoryById",
            "ForumController#getPostReactionCounts",
            "ForumController#getPostsByTopicId",
            "ForumController#getTopicByTitle",
            "ForumController#getTopicsByCategoryId",
            // Public fundraising reads + donation creation (donor may be anonymous)
            "FundController#getAll",
            "FundController#getDetail",
            "FundController#getStatistics",
            "FundController#getSupportedBanks",
            "FundDonationsController#createDonation",
            "FundDonationsController#getDonations",
            // Public organization reads
            "OrganizationController#getAllOrganizations",
            "OrganizationController#getIntroduction",
            "OrganizationController#getOrganizationBySlug",
            "OrganizationController#getTrustedVerifiers",
            // Public user profile
            "PublicUserController#getPublicProfile"
    ));

    @Test
    @DisplayName("set of @PublicEndpoint handlers must match the reviewed allowlist")
    void publicEndpointsMatchAllowlist() throws Exception {
        Set<String> actual = scanPublicHandlers();
        assertThat(actual)
                .as("Public (no-auth) endpoints changed. An endpoint became public or stopped "
                        + "being public. Review the security impact, then update "
                        + "EXPECTED_PUBLIC_ENDPOINTS to match.")
                .isEqualTo(EXPECTED_PUBLIC_ENDPOINTS);
    }

    @Test
    @DisplayName("no endpoint under /api/admin may be public")
    void adminEndpointsAreNeverPublic() throws Exception {
        Set<String> adminPublic = new TreeSet<>();
        for (Class<?> controller : findRestControllers()) {
            RequestMapping base = controller.getAnnotation(RequestMapping.class);
            boolean adminController = base != null && base.value().length > 0
                    && base.value()[0].startsWith("/api/admin");
            if (!adminController) {
                continue;
            }
            boolean classPublic = controller.isAnnotationPresent(PublicEndpoint.class);
            for (Method m : controller.getDeclaredMethods()) {
                if (isHandler(m) && (classPublic || m.isAnnotationPresent(PublicEndpoint.class))) {
                    adminPublic.add(controller.getSimpleName() + "#" + m.getName());
                }
            }
        }
        assertThat(adminPublic)
                .as("Admin endpoints must always require authentication; remove @PublicEndpoint.")
                .isEmpty();
    }

    private Set<String> scanPublicHandlers() throws Exception {
        Set<String> result = new TreeSet<>();
        for (Class<?> controller : findRestControllers()) {
            boolean classPublic = controller.isAnnotationPresent(PublicEndpoint.class);
            for (Method m : controller.getDeclaredMethods()) {
                if (!isHandler(m)) {
                    continue;
                }
                if (classPublic || m.isAnnotationPresent(PublicEndpoint.class)) {
                    result.add(controller.getSimpleName() + "#" + m.getName());
                }
            }
        }
        return result;
    }

    private Set<Class<?>> findRestControllers() throws ClassNotFoundException {
        ClassPathScanningCandidateComponentProvider scanner =
                new ClassPathScanningCandidateComponentProvider(false);
        scanner.addIncludeFilter(new AnnotationTypeFilter(RestController.class));
        Set<Class<?>> controllers = new TreeSet<>((a, b) -> a.getName().compareTo(b.getName()));
        for (BeanDefinition bd : scanner.findCandidateComponents(BASE_PACKAGE)) {
            controllers.add(Class.forName(bd.getBeanClassName()));
        }
        return controllers;
    }

    private boolean isHandler(Method m) {
        return m.isAnnotationPresent(GetMapping.class)
                || m.isAnnotationPresent(PostMapping.class)
                || m.isAnnotationPresent(PutMapping.class)
                || m.isAnnotationPresent(DeleteMapping.class)
                || m.isAnnotationPresent(PatchMapping.class)
                || m.isAnnotationPresent(RequestMapping.class);
    }
}
