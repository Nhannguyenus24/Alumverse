package com.service.backend.user.service;

import com.service.backend.shared.entity.Notification;
import com.service.backend.shared.enums.ErrorCode;
import com.service.backend.shared.exception.ApplicationException;
import com.service.backend.user.dao.NotificationRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("NotificationService Unit Tests")
class NotificationServiceTest {

    @Mock private NotificationRepository notificationRepository;

    @InjectMocks
    private NotificationService notificationService;

    // ─── getMyNotifications ───────────────────────────────────────────────────

    @Nested
    @DisplayName("getMyNotifications()")
    class GetMyNotifications {

        @Test
        @DisplayName("should return a list of notifications")
        void getMyNotifications_success() {
            Notification notif1 = Notification.builder()
                    .id(1)
                    .title("Welcome")
                    .isRead(false)
                    .createdAt(LocalDateTime.now())
                    .build();

            when(notificationRepository.findByMemberIdOrderByCreatedAtDesc(1))
                    .thenReturn(Flux.just(notif1));

            StepVerifier.create(notificationService.getMyNotifications(1L))
                    .assertNext(list -> {
                        assertThat(list).hasSize(1);
                        assertThat(list.get(0).getTitle()).isEqualTo("Welcome");
                    })
                    .verifyComplete();
        }

        @Test
        @DisplayName("should return empty list when no notifications")
        void getMyNotifications_empty() {
            when(notificationRepository.findByMemberIdOrderByCreatedAtDesc(1))
                    .thenReturn(Flux.empty());

            StepVerifier.create(notificationService.getMyNotifications(1L))
                    .assertNext(list -> assertThat(list).isEmpty())
                    .verifyComplete();
        }
    }

    // ─── markAsRead ───────────────────────────────────────────────────────────

    @Nested
    @DisplayName("markAsRead()")
    class MarkAsRead {

        @Test
        @DisplayName("should mark notification as read successfully")
        void markAsRead_success() {
            when(notificationRepository.markAsRead(1, 1)).thenReturn(Mono.just(1));

            StepVerifier.create(notificationService.markAsRead(1L, 1))
                    .verifyComplete();
        }

        @Test
        @DisplayName("should fail when notification not found or belongs to another user")
        void markAsRead_notFound() {
            when(notificationRepository.markAsRead(99, 1)).thenReturn(Mono.just(0));

            StepVerifier.create(notificationService.markAsRead(1L, 99))
                    .expectErrorMatches(err -> err instanceof ApplicationException &&
                            ((ApplicationException) err).getErrorCode() == ErrorCode.RESOURCES_NOT_FOUND)
                    .verify();
        }


    }

    // ─── deleteNotification ───────────────────────────────────────────────────

    @Nested
    @DisplayName("deleteNotification()")
    class DeleteNotification {

        @Test
        @DisplayName("should delete notification successfully")
        void deleteNotification_success() {
            when(notificationRepository.deleteByIdAndMemberId(1, 1)).thenReturn(Mono.just(1));

            StepVerifier.create(notificationService.deleteNotification(1L, 1))
                    .verifyComplete();
        }

        @Test
        @DisplayName("should fail when notification not found")
        void deleteNotification_notFound() {
            when(notificationRepository.deleteByIdAndMemberId(99, 1)).thenReturn(Mono.just(0));

            StepVerifier.create(notificationService.deleteNotification(1L, 99))
                    .expectErrorMatches(err -> err instanceof ApplicationException &&
                            ((ApplicationException) err).getErrorCode() == ErrorCode.RESOURCES_NOT_FOUND)
                    .verify();
        }


    }

    // ─── deleteAllNotifications ───────────────────────────────────────────────

    @Nested
    @DisplayName("deleteAllNotifications()")
    class DeleteAllNotifications {

        @Test
        @DisplayName("should delete all notifications for user")
        void deleteAllNotifications_success() {
            when(notificationRepository.deleteAllByMemberId(1)).thenReturn(Mono.just(5));

            StepVerifier.create(notificationService.deleteAllNotifications(1L))
                    .verifyComplete();
        }
    }
}
