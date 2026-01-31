package com.service.backend.auth.repository;

import org.springframework.data.r2dbc.repository.Modifying;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import com.service.backend.auth.entity.User;
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
     * Check if email exists
     */
    Mono<Boolean> existsByEmail(String email);
    
    /**
     * Check if username exists
     */
    Mono<Boolean> existsByUserName(String userName);
    
    /**
     * Find active user by email
     */
    @Query("SELECT * FROM users WHERE email = :email AND status = 'active'")
    Mono<User> findActiveByEmail(@Param("email") String email);
    
    /**
     * Find active user by username
     */
    @Query("SELECT * FROM users WHERE user_name = :userName AND status = 'active'")
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
    @Query("UPDATE users SET status = 'active', updated_at = CURRENT_TIMESTAMP WHERE id = :id")
    Mono<Void> activateUserById(@Param("id") Integer id);
    
    /**
     * Update user status to pending (for new registrations)
     */
    @Modifying
    @Query("UPDATE users SET status = 'pending', updated_at = CURRENT_TIMESTAMP WHERE id = :id")
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
    @Query("SELECT * FROM users WHERE email = :email AND (status = 'pending' OR status = 'active')")
    Mono<User> findPendingOrActiveByEmail(@Param("email") String email);
    
    /**
     * Register new user with unverified status and alumni role
     * Returns the created user
     */
    @Modifying
    @Query("INSERT INTO users (email, user_name, password_hash, role, status, created_at, updated_at) " +
           "VALUES (:email, :userName, :passwordHash, 'alumni', 'unverified', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)")
    Mono<Void> registerNewUser(@Param("email") String email, @Param("userName") String userName, @Param("passwordHash") String passwordHash);
}
