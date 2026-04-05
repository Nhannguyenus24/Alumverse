package com.service.backend.auth.dao;

import java.util.List;

import org.springframework.data.r2dbc.repository.Modifying;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.service.backend.auth.entity.User;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface AuthRepository extends R2dbcRepository<User, Integer> {
    
    /**
     * Find user by email
     */
    Mono<User> findByEmail(String email);
    
    /**
     * Find user by username
     */
    Mono<User> findByUserName(String userName);

    /**
     * Check if user exists by email or username (for registration validation)
     */
    Mono<Boolean> existsByEmailOrUserName(String email, String userName);

    /**
     * Find active user by email
     */
    @Query("SELECT * FROM users WHERE email = :email AND status = 'ACTIVE'")
    Mono<User> findActiveByEmail(@Param("email") String email);
    
    /**
     * Find active user by username
     */
    @Query("SELECT * FROM users WHERE user_name = :userName AND status = 'ACTIVE'")
    Mono<User> findActiveByUserName(@Param("userName") String userName);
    
    /**
     * Find user by email and password for login
     */
    @Query("SELECT * FROM users WHERE email = :email AND password_hash = :passwordHash")
    Mono<User> findByEmailAndPassword(@Param("email") String email, @Param("passwordHash") String passwordHash);
    
    /**
     * Find user by username and password for login
     */
    @Query("SELECT * FROM users WHERE user_name = :userName AND password_hash = :passwordHash")
    Mono<User> findByUsernameAndPassword(@Param("userName") String userName, @Param("passwordHash") String passwordHash);
    
    /**
     * Update user password by id
     */
    @Modifying
    @Query("UPDATE users SET password_hash = :passwordHash, updated_at = CURRENT_TIMESTAMP WHERE id = :id")
    Mono<Void> updatePasswordById(@Param("id") Integer id, @Param("passwordHash") String passwordHash);
    
    /**
     * Update user avatar by id
     */
    @Modifying
    @Query("UPDATE users SET avatar_url = :avatarUrl, updated_at = CURRENT_TIMESTAMP WHERE id = :id")
    Mono<Void> updateAvatarById(@Param("id") Integer id, @Param("avatarUrl") String avatarUrl);
    
    /**
     * Update user status to active after successful verification
     */
    @Modifying
    @Query("UPDATE users SET status = 'ACTIVE', updated_at = CURRENT_TIMESTAMP WHERE id = :id")
    Mono<Void> activateUserById(@Param("id") Integer id);
    
    /**
     * Update user status to pending (for new registrations)
     */
    @Modifying
    @Query("UPDATE users SET status = 'PENDING', updated_at = CURRENT_TIMESTAMP WHERE id = :id")
    Mono<Void> updateStatusToPendingById(@Param("id") Integer id);
    
    /**
     * Update user status by id
     */
    @Modifying
    @Query("UPDATE users SET status = :status, updated_at = CURRENT_TIMESTAMP WHERE id = :id")
    Mono<Void> updateStatusById(@Param("id") Integer id, @Param("status") String status);
    
    /**
     * Find user by email (pending or active) for registration check
     */
    @Query("SELECT * FROM users WHERE email = :email AND (status = 'PENDING' OR status = 'ACTIVE')")
    Mono<User> findPendingOrActiveByEmail(@Param("email") String email);
    
    /**
     * Register new user with unverified status and alumni role
     * Returns the created user
     */
    @Modifying
    @Query("INSERT INTO users (email, user_name, password_hash, role, status, created_at, updated_at) " +
           "VALUES (:email, :userName, :passwordHash, 'ALUMNI', 'UNVERIFIED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)")
    Mono<Void> registerNewUser(@Param("email") String email, @Param("userName") String userName, @Param("passwordHash") String passwordHash);
    
    /**
     * Get organization IDs for a user from organization_members table
     * Returns empty Flux if user is not a member of any organization
     */
    @Query("SELECT om.organization_id FROM organization_members om WHERE om.user_id = :userId")
    Flux<Integer> getOrganizationIdByUserId(@Param("userId") Integer userId);
}
