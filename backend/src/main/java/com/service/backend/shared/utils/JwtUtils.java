package com.service.backend.shared.utils;

import java.time.Instant;
import java.util.Date;

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

    public JwtUtils(String jwtSecret, long accessTokenExpirationMs, long refreshTokenExpirationMs) {
        this.accessTokenExpirationMs = accessTokenExpirationMs;
        this.refreshTokenExpirationMs = refreshTokenExpirationMs;
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

    public JWTClaimsSet validateToken(String token) {
        try {
            SignedJWT signedJWT = SignedJWT.parse(token);

            if (!signedJWT.verify(verifier)) {
                throw new ApplicationException(ErrorCode.INVALID_ACCESS_TOKEN, "Invalid token signature");
            }

            JWTClaimsSet claims = signedJWT.getJWTClaimsSet();
            Date expirationTime = claims.getExpirationTime();
            if (expirationTime != null && expirationTime.before(new Date())) {
                throw new ApplicationException(ErrorCode.INVALID_ACCESS_TOKEN, "Token has expired");
            }

            return claims;
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
