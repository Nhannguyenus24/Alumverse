package com.service.backend.shared.annotations;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Marks a method as requiring authentication, overriding any class-level {@link PublicEndpoint}.
 *
 * <p>Use this on mutating handlers (POST/PUT/DELETE/PATCH) inside a class-level {@code @PublicEndpoint}
 * controller so they are excluded from the public (method, path) registry and are not reachable
 * without a token. Pair with {@code @PreAuthorize} when a specific role is also required.
 */
@Target({ElementType.METHOD})
@Retention(RetentionPolicy.RUNTIME)
public @interface PrivateEndpoint {
}
