package com.service.backend.shared.utils;

import com.nimbusds.jose.*;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jose.crypto.MACVerifier;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import java.text.ParseException;
import java.time.Instant;
import java.util.Date;

public class JwtUtils {

    private final String jwtSecret;
    private final long accessTokenExpirationMs;
    private final long refreshTokenExpirationMs;

    public JwtUtils(String jwtSecret, long accessTokenExpirationMs, long refreshTokenExpirationMs) {
        this.jwtSecret = jwtSecret;
        this.accessTokenExpirationMs = accessTokenExpirationMs;
        this.refreshTokenExpirationMs = refreshTokenExpirationMs;
    }

    public String generateAccessToken(Integer userId, String email, String role, String userName, String avatarUrl) {
        try {
            Instant now = Instant.now();
            Instant expiryDate = now.plusMillis(accessTokenExpirationMs);

            JWTClaimsSet claimsSet = new JWTClaimsSet.Builder()
                    .subject(String.valueOf(userId))
                    .claim("email", email)
                    .claim("role", role)
                    .claim("username", userName)
                    .claim("avatar", avatarUrl)
                    .issueTime(Date.from(now))
                    .expirationTime(Date.from(expiryDate))
                    .build();

            SignedJWT signedJWT = new SignedJWT(
                    new JWSHeader(JWSAlgorithm.HS256),
                    claimsSet
            );

            JWSSigner signer = new MACSigner(jwtSecret.getBytes());
            signedJWT.sign(signer);

            return signedJWT.serialize();
        } catch (JOSEException e) {
            throw new RuntimeException("Error generating access token", e);
        }
    }

    /**
     * Generate refresh token (7 days)
     */
    public String generateRefreshToken(Integer userId) {
        try {
            Instant now = Instant.now();
            Instant expiryDate = now.plusMillis(refreshTokenExpirationMs);

            JWTClaimsSet claimsSet = new JWTClaimsSet.Builder()
                    .subject(String.valueOf(userId))
                    .issueTime(Date.from(now))
                    .expirationTime(Date.from(expiryDate))
                    .build();

            SignedJWT signedJWT = new SignedJWT(
                    new JWSHeader(JWSAlgorithm.HS256),
                    claimsSet
            );

            JWSSigner signer = new MACSigner(jwtSecret.getBytes());
            signedJWT.sign(signer);

            return signedJWT.serialize();
        } catch (JOSEException e) {
            throw new RuntimeException("Error generating refresh token", e);
        }
    }

    /**
     * Validate and parse JWT token
     */
    public JWTClaimsSet validateToken(String token) {
        try {
            SignedJWT signedJWT = SignedJWT.parse(token);
            JWSVerifier verifier = new MACVerifier(jwtSecret.getBytes());

            if (!signedJWT.verify(verifier)) {
                throw new RuntimeException("Invalid token signature");
            }

            JWTClaimsSet claims = signedJWT.getJWTClaimsSet();

            // Check expiration
            Date expirationTime = claims.getExpirationTime();
            if (expirationTime != null && expirationTime.before(new Date())) {
                throw new RuntimeException("Token has expired");
            }

            return claims;
        } catch (ParseException | JOSEException e) {
            throw new RuntimeException("Error validating token", e);
        }
    }

    /**
     * Get user ID from token
     */
    public Integer getUserIdFromToken(String token) {
        JWTClaimsSet claims = validateToken(token);
        return Integer.valueOf(claims.getSubject());
    }

    /**
     * Get email from token
     */
    public String getEmailFromToken(String token) {
        JWTClaimsSet claims = validateToken(token);
        return (String) claims.getClaim("email");
    }

    /**
     * Get role from token
     */
    public String getRoleFromToken(String token) {
        JWTClaimsSet claims = validateToken(token);
        return (String) claims.getClaim("role");
    }

    /**
     * Check if token is expired
     */
    public boolean isTokenExpired(String token) {
        try {
            JWTClaimsSet claims = validateToken(token);
            Date expirationTime = claims.getExpirationTime();
            return expirationTime != null && expirationTime.before(new Date());
        } catch (Exception e) {
            return true;
        }
    }
}