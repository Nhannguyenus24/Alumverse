package com.service.auth.infrastructure;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;

@Component
public class JwtUtil {

    private final String SECRET_KEY;

    private final long EXPIRATION_ACCESS;

    private final long EXPIRATION_REFRESH;

    public JwtUtil(
            @Value("${jwt.secret}") String secretKey,
            @Value("${jwt.expiration_access}") long expiration_access,
            @Value("${jwt.expiration_refresh}") long expiration_refresh
    ) {
        this.SECRET_KEY = secretKey;
        this.EXPIRATION_ACCESS = expiration_access;
        this.EXPIRATION_REFRESH = expiration_refresh;
    }

    private Key getSigningKey() {
        return Keys.hmacShaKeyFor(this.SECRET_KEY.getBytes());
    }

    public String generateAccessToken(String userId, String userRole) {
        return Jwts.builder()
                .setSubject(userId)
                .claim("role", userRole)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + this.EXPIRATION_ACCESS))
                .signWith(this.getSigningKey())
                .compact();
    }

    public String generateRefreshToken(String userId) {
        return Jwts.builder()
                .setSubject(userId)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + this.EXPIRATION_REFRESH))
                .signWith(this.getSigningKey())
                .compact();
    }

    public String extractUserId(String token) {
        return this.getClaims(token).getSubject();
    }

    public String extractUserRole(String token) {
        return this.getClaims(token).get("role", String.class);
        // Can return null
    }

    private Claims getClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(this.getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    public boolean validateToken(String token) {
        try {
            Jwts.parserBuilder()
                    .setSigningKey(this.getSigningKey())
                    .build()
                    .parseClaimsJws(token);
            return true;
        } catch(ExpiredJwtException e) {
            return false;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }
}
