package com.service.backend.user.service;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import com.service.backend.shared.enums.ErrorCode;
import com.service.backend.shared.exception.ApplicationException;
import com.service.backend.user.dao.NotificationRepository;
import com.service.backend.user.dto.NotificationResponse;
import com.service.backend.shared.entity.Notification;

import lombok.RequiredArgsConstructor;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

@Service
@RequiredArgsConstructor
public class NotificationService {

	private static final Logger logger = LoggerFactory.getLogger(NotificationService.class);

	private final NotificationRepository notificationRepository;

	public void createNotificationAsync(Integer memberId, String title, String message) {
		createNotificationAsync(memberId, title, message, null);
	}

	public void createNotificationAsync(Integer memberId, String title, String message, String link) {
		Notification notification = Notification.builder()
				.memberId(memberId)
				.title(title)
				.message(message)
				.isRead(false)
				.link(link)
				.build();

		notificationRepository.save(notification)
				.then()
				.onErrorResume(error -> {
					logger.warn("Failed to save notification for member id: {}", memberId, error);
					return Mono.empty();
				})
				.subscribeOn(Schedulers.boundedElastic())
				.subscribe();
	}

	public Mono<List<NotificationResponse>> getMyNotifications(Long currentUserId) {
		return notificationRepository.findByMemberIdOrderByCreatedAtDesc(currentUserId.intValue())
				.map(notification -> NotificationResponse.builder()
						.id(notification.getId())
						.title(notification.getTitle())
						.message(notification.getMessage())
						.isRead(notification.getIsRead())
						.link(notification.getLink())
						.createdAt(notification.getCreatedAt())
						.build())
				.collectList();
	}

	public Mono<Void> markAsRead(Long currentUserId, Integer notificationId) {
		return notificationRepository.markAsRead(notificationId, currentUserId.intValue())
				.flatMap(updatedRows -> {
					if (updatedRows == null || updatedRows <= 0) {
						return Mono.error(new ApplicationException(
								ErrorCode.RESOURCES_NOT_FOUND,
								"Notification not found"));
					}
					return Mono.empty();
				});
	}

	public Mono<Void> deleteNotification(Long currentUserId, Integer notificationId) {
		return notificationRepository.deleteByIdAndMemberId(notificationId, currentUserId.intValue())
				.flatMap(deletedRows -> {
					if (deletedRows == null || deletedRows <= 0) {
						return Mono.error(new ApplicationException(
								ErrorCode.RESOURCES_NOT_FOUND,
								"Notification not found"));
					}
					return Mono.empty();
				});
	}

	public Mono<Void> deleteAllNotifications(Long currentUserId) {
		return notificationRepository.deleteAllByMemberId(currentUserId.intValue()).then();
	}
}
