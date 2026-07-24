package com.service.backend.config;

import static org.assertj.core.api.Assertions.assertThat;

import java.lang.reflect.Method;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.TreeSet;

import org.junit.jupiter.api.Test;
import org.springframework.context.annotation.ClassPathScanningCandidateComponentProvider;
import org.springframework.core.annotation.AnnotatedElementUtils;
import org.springframework.core.type.filter.AnnotationTypeFilter;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

import com.service.backend.shared.annotations.PrivateEndpoint;
import com.service.backend.shared.annotations.PublicEndpoint;

/**
 * Guardrail against the "method-blind public endpoint" vulnerability, where a public
 * {@code @GetMapping} once left its sibling POST/PUT/DELETE on the same path reachable without a
 * token (e.g. {@code POST /api/events} createEvent).
 *
 * <p>This test independently scans every controller by reflection — it does NOT boot the Spring
 * context or trust {@link PublicEndpointConfig} — and reproduces the exact rule the security layer
 * applies: an endpoint is public iff it (or its declaring class) is {@code @PublicEndpoint} and the
 * method is not {@code @PrivateEndpoint}. It then asserts that every <b>mutating</b> endpoint
 * (POST/PUT/DELETE/PATCH) exposed as public is in a curated, intentional allowlist. Any newly public
 * write endpoint fails the build, forcing a conscious decision: annotate it correctly or justify it here.
 */
class PublicEndpointAuthGuardTest {

    private static final String BASE_PACKAGE = "com.service.backend";

    private static final Set<String> MUTATING_METHODS = Set.of("POST", "PUT", "DELETE", "PATCH");

    /**
     * Controllers that are public by design at the class level (whole surface is intentionally open).
     * Any public write under these path prefixes is allowed.
     */
    private static final List<String> ALLOWED_PUBLIC_WRITE_PREFIXES = List.of(
            "/api/auth/",     // AuthController: login, register, refresh, otp, reset-password, ...
            "/api/fitbot/"    // FitBotController: public chatbot query endpoints
    );

    /** Individually-public write endpoints, declared "METHOD pattern". */
    private static final Set<String> ALLOWED_PUBLIC_WRITES = Set.of(
            "POST /api/organizations/{organizationId}/feedbacks", // anonymous org feedback
            "POST /api/fund-donations"                             // public donation creation
    );

    @Test
    void noUnintendedPublicWriteEndpoints() throws Exception {
        Set<String> violations = new TreeSet<>();

        for (Class<?> controller : findControllers()) {
            boolean classPublic = AnnotatedElementUtils.hasAnnotation(controller, PublicEndpoint.class);
            Set<String> basePaths = pathsOf(AnnotatedElementUtils.findMergedAnnotation(controller, RequestMapping.class));

            for (Method method : controller.getDeclaredMethods()) {
                RequestMapping mapping = AnnotatedElementUtils.findMergedAnnotation(method, RequestMapping.class);
                if (mapping == null) {
                    continue;
                }
                boolean methodPrivate = AnnotatedElementUtils.hasAnnotation(method, PrivateEndpoint.class);
                boolean methodPublic = AnnotatedElementUtils.hasAnnotation(method, PublicEndpoint.class);
                boolean isPublic = !methodPrivate && (methodPublic || classPublic);
                if (!isPublic) {
                    continue;
                }

                Set<String> verbs = new LinkedHashSet<>();
                for (RequestMethod rm : mapping.method()) {
                    verbs.add(rm.name());
                }
                Set<String> fullPatterns = combine(basePaths, pathsOf(mapping));

                for (String pattern : fullPatterns) {
                    // A mapping with no explicit verb matches every method, including writes.
                    boolean matchesWriteVerb = verbs.isEmpty() || verbs.stream().anyMatch(MUTATING_METHODS::contains);
                    if (!matchesWriteVerb) {
                        continue;
                    }
                    for (String verb : verbs.isEmpty() ? MUTATING_METHODS : verbs) {
                        if (MUTATING_METHODS.contains(verb) && !isAllowed(verb, pattern)) {
                            violations.add(verb + " " + pattern + "  (" + controller.getSimpleName()
                                    + "#" + method.getName() + ")");
                        }
                    }
                }
            }
        }

        assertThat(violations)
                .as("Mutating endpoints exposed as public without an entry in the allowlist. "
                        + "If a write endpoint should require auth, remove @PublicEndpoint (or add @PrivateEndpoint "
                        + "inside a class-level @PublicEndpoint controller). If it is intentionally public, add it "
                        + "to ALLOWED_PUBLIC_WRITES / ALLOWED_PUBLIC_WRITE_PREFIXES in this test with justification.")
                .isEmpty();
    }

    private boolean isAllowed(String verb, String pattern) {
        if (ALLOWED_PUBLIC_WRITE_PREFIXES.stream().anyMatch(pattern::startsWith)) {
            return true;
        }
        return ALLOWED_PUBLIC_WRITES.contains(verb + " " + pattern);
    }

    private Set<Class<?>> findControllers() throws ClassNotFoundException {
        ClassPathScanningCandidateComponentProvider scanner =
                new ClassPathScanningCandidateComponentProvider(false);
        scanner.addIncludeFilter(new AnnotationTypeFilter(RestController.class));
        scanner.addIncludeFilter(new AnnotationTypeFilter(Controller.class));

        Set<Class<?>> controllers = new LinkedHashSet<>();
        for (var bd : scanner.findCandidateComponents(BASE_PACKAGE)) {
            controllers.add(Class.forName(bd.getBeanClassName()));
        }
        return controllers;
    }

    /** Path patterns declared by a @RequestMapping (via value() or path()); empty set if none. */
    private Set<String> pathsOf(RequestMapping mapping) {
        Set<String> paths = new LinkedHashSet<>();
        if (mapping != null) {
            for (String p : mapping.value()) {
                paths.add(p);
            }
            for (String p : mapping.path()) {
                paths.add(p);
            }
        }
        return paths;
    }

    /** Reproduces Spring's base-path + method-path combination. */
    private Set<String> combine(Set<String> bases, Set<String> subs) {
        Set<String> result = new LinkedHashSet<>();
        Set<String> effectiveBases = bases.isEmpty() ? Set.of("") : bases;
        Set<String> effectiveSubs = subs.isEmpty() ? Set.of("") : subs;
        for (String base : effectiveBases) {
            for (String sub : effectiveSubs) {
                result.add(join(base, sub));
            }
        }
        return result;
    }

    private String join(String base, String sub) {
        if (sub.isEmpty()) {
            return base;
        }
        if (base.isEmpty()) {
            return sub;
        }
        boolean baseSlash = base.endsWith("/");
        boolean subSlash = sub.startsWith("/");
        if (baseSlash && subSlash) {
            return base + sub.substring(1);
        }
        if (!baseSlash && !subSlash) {
            return base + "/" + sub;
        }
        return base + sub;
    }
}
