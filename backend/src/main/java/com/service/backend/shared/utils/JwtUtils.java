package com.service.backend.shared.utils;

import java.time.Duration;
import java.time.Instant;
import java.util.Date;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import com.nimbusds.jose.JOSEException;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.JWSSigner;
import com.nimbusds.jose.JWSVerifier;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jose.crypto.MACVerifier;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import com.service.backend.shared.exception.ApplicationException;
import com.service.backend.shared.enums.ErrorCode;

import java.text.ParseException;

public class JwtUtils {

    private static final JWSHeader JWT_HEADER = new JWSHeader(JWSAlgorithm.HS256);

    private final long accessTokenExpirationMs;
    private final long refreshTokenExpirationMs;
    private final JWSSigner signer;
    private final JWSVerifier verifier;

    /**
     * Caches the result of the expensive parse + HMAC signature verification keyed by the raw
     * token string. Expiration is still re-checked on every call (see {@link #validateToken}),
     * so caching changes performance only, never the validation outcome. Entries expire well
     * within the access-token lifetime to bound memory and limit any revocation window.
     */
    private final Cache<String, JWTClaimsSet> verifiedTokenCache = Caffeine.newBuilder()
            .expireAfterWrite(Duration.ofMinutes(15))
            .maximumSize(50_000)
            .build();

    /**
     * Holds access tokens explicitly revoked (e.g. on logout). A stateless JWT is otherwise
     * valid until its expiry; this blacklist lets {@link #validateToken} reject a token early.
     * Entries are kept only for the access-token lifetime — once the token would expire on its
     * own there is nothing left to revoke — which bounds memory without a sweeper.
     */
    private final Cache<String, Boolean> revokedTokenCache;

    public JwtUtils(String jwtSecret, long accessTokenExpirationMs, long refreshTokenExpirationMs) {
        this.accessTokenExpirationMs = accessTokenExpirationMs;
        this.refreshTokenExpirationMs = refreshTokenExpirationMs;
        this.revokedTokenCache = Caffeine.newBuilder()
                .expireAfterWrite(Duration.ofMillis(accessTokenExpirationMs))
                .maximumSize(50_000)
                .build();
        try {
            byte[] secretKeyBytes = jwtSecret.getBytes();
            this.signer = new MACSigner(secretKeyBytes);
            this.verifier = new MACVerifier(secretKeyBytes);
        } catch (JOSEException e) {
            throw new ApplicationException(ErrorCode.ERROR_SIGNING_JWT_TOKEN, "Failed to initialize JWT signer/verifier");
        }
    }

    public String generateAccessToken(Integer userId, String email, String role, String avatarUrl, Integer organizationId) {
        Instant now = Instant.now();
        JWTClaimsSet claimsSet = new JWTClaimsSet.Builder()
                .subject(String.valueOf(userId))
                .claim("email", email)
                .claim("role", role)
                .claim("avatar", avatarUrl)
                .claim("organizationId", organizationId)
                .issueTime(Date.from(now))
                .expirationTime(Date.from(now.plusMillis(accessTokenExpirationMs)))
                .build();
        return signAndSerialize(claimsSet);
    }

    public String generateRefreshToken(Integer userId, Integer organizationId) {
        return generateRefreshToken(userId, organizationId, refreshTokenExpirationMs);
    }

    public String generateRefreshToken(Integer userId, Integer organizationId, long expirationMs) {
        Instant now = Instant.now();
        JWTClaimsSet.Builder builder = new JWTClaimsSet.Builder()
                .subject(String.valueOf(userId))
                .issueTime(Date.from(now))
                .expirationTime(Date.from(now.plusMillis(expirationMs)));
        if (organizationId != null) {
            builder.claim("organizationId", organizationId);
        }
        return signAndSerialize(builder.build());
    }

    /**
     * Revokes an access token so subsequent {@link #validateToken} calls reject it. Called on
     * logout. Idempotent; revoking an unknown/expired token is a no-op.
     */
    public void revokeToken(String token) {
        if (token != null && !token.isBlank()) {
            revokedTokenCache.put(token, Boolean.TRUE);
        }
    }

    public JWTClaimsSet validateToken(String token) {
        // Reject explicitly revoked tokens (e.g. after logout) before any other work.
        if (revokedTokenCache.getIfPresent(token) != null) {
            throw new ApplicationException(ErrorCode.INVALID_ACCESS_TOKEN, "Token has been revoked");
        }

        // Parse + signature verification are deterministic for a given token, so cache them.
        // Invalid/forged tokens throw from the loader and are not cached.
        JWTClaimsSet claims = verifiedTokenCache.get(token, this::parseAndVerify);

        // Expiration is re-evaluated on every call so behavior is identical to validating fresh.
        Date expirationTime = claims.getExpirationTime();
        if (expirationTime != null && expirationTime.before(new Date())) {
            throw new ApplicationException(ErrorCode.INVALID_ACCESS_TOKEN, "Token has expired");
        }

        return claims;
    }

    private JWTClaimsSet parseAndVerify(String token) {
        try {
            SignedJWT signedJWT = SignedJWT.parse(token);

            if (!signedJWT.verify(verifier)) {
                throw new ApplicationException(ErrorCode.INVALID_ACCESS_TOKEN, "Invalid token signature");
            }

            return signedJWT.getJWTClaimsSet();
        } catch (ParseException | JOSEException e) {
            throw new ApplicationException(ErrorCode.ERROR_VALIDATE_JWT_TOKEN, "Error validating token");
        }
    }



    private String signAndSerialize(JWTClaimsSet claimsSet) {
        try {
            SignedJWT signedJWT = new SignedJWT(JWT_HEADER, claimsSet);
            signedJWT.sign(signer);
            return signedJWT.serialize();
        } catch (JOSEException e) {
            throw new ApplicationException(ErrorCode.ERROR_SIGNING_JWT_TOKEN, "Error signing JWT token");
        }
    }
}
