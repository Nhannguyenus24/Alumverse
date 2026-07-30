package com.service.backend.shared.annotations;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Marks a controller method (or an entire controller class) as public — no authentication required.
 *
 * <p>Public access is registered per <b>(HTTP method, path pattern)</b> pair by
 * {@code PublicEndpointConfig}, NOT by path alone. A public {@code @GetMapping("/x")} therefore does
 * <b>not</b> open a sibling {@code @PostMapping("/x")} / PUT / DELETE on the same path — those still
 * require a valid token unless they too are annotated.
 *
 * <p>When placed on a class, every handler in that class becomes public for its own verb; use
 * {@link PrivateEndpoint} on individual methods to opt them back out.
 *
 * <p>Endpoints with no annotation are authenticated by default. Role-restricted endpoints use
 * {@code @PreAuthorize} instead. Non-controller/infra paths live in {@code SecurityConfig.INFRA_PUBLIC_URLS}.
 */
@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
public @interface PublicEndpoint {
}
