package com.service.backend.shared.utils;

/**
 * Keys under which the authentication filter stashes the resolved identity of the
 * current request into {@code ServerWebExchange#getAttributes()}.
 *
 * <p>The reactive security context (populated via {@code contextWrite}) is only visible
 * to operators <em>downstream</em> of the security filter chain, so a plain {@code WebFilter}
 * cannot read it from its own {@code doFinally}. Exchange attributes, by contrast, are a
 * plain mutable map shared across the whole filter chain — making them the reliable way for
 * the audit filter to know which admin performed the request.
 */
public final class AuthExchangeAttributes {

    private AuthExchangeAttributes() {}

    public static final String USER_ID = "auth.userId";
    public static final String ROLE = "auth.role";
    public static final String ORGANIZATION_ID = "auth.organizationId";
}
