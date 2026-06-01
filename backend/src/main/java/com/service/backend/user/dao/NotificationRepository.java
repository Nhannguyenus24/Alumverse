package com.service.backend.user.dao;

import org.springframework.data.r2dbc.repository.Modifying;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.stereotype.Repository;

import com.service.backend.user.entity.Notification;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface NotificationRepository extends R2dbcRepository<Notification, Integer> {

    @Query("SELECT * FROM notifications WHERE member_id = :memberId ORDER BY created_at DESC")
    Flux<Notification> findByMemberIdOrderByCreatedAtDesc(Integer memberId);

    @Modifying
    @Query("UPDATE notifications SET is_read = true WHERE id = :notificationId AND member_id = :memberId")
    Mono<Integer> markAsRead(Integer notificationId, Integer memberId);

    @Modifying
    @Query("DELETE FROM notifications WHERE id = :notificationId AND member_id = :memberId")
    Mono<Integer> deleteByIdAndMemberId(Integer notificationId, Integer memberId);

    @Modifying
    @Query("DELETE FROM notifications WHERE member_id = :memberId")
    Mono<Integer> deleteAllByMemberId(Integer memberId);
}
