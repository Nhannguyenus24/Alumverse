package com.service.backend.shared.service;

import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.FirebaseMessagingException;
import com.google.firebase.messaging.Message;
import com.google.firebase.messaging.Notification;
import com.service.backend.user.dao.DeviceTokenRepository;
import com.service.backend.user.dao.UserNotificationSettingsRepository;

import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

/**
 * Sends FCM push to every device registered for a user, gated on the user's
 * push_enabled preference. No-op when Firebase isn't configured.
 */
@Service
public class FcmService {

    private static final Logger log = LoggerFactory.getLogger(FcmService.class);

    private final DeviceTokenRepository deviceTokenRepository;
    private final UserNotificationSettingsRepository settingsRepository;
    private final FirebaseMessaging firebaseMessaging;

    public FcmService(DeviceTokenRepository deviceTokenRepository,
            UserNotificationSettingsRepository settingsRepository,
            @Autowired(required = false) FirebaseMessaging firebaseMessaging) {
        this.deviceTokenRepository = deviceTokenRepository;
        this.settingsRepository = settingsRepository;
        this.firebaseMessaging = firebaseMessaging;
    }

    /** Fire-and-forget push to all of a user's devices. */
    public void sendToUser(Integer userId, String title, String body, String link) {
        if (firebaseMessaging == null || userId == null) {
            return;
        }
        settingsRepository.findById(userId)
                .map(s -> s.getPushEnabled() == null || s.getPushEnabled())
                .defaultIfEmpty(true)
                .filter(Boolean::booleanValue)
                .flatMapMany(ignored -> deviceTokenRepository.findTokensByUserId(userId))
                .flatMap(token -> send(token, title, body, link))
                .onErrorResume(e -> {
                    log.warn("FCM push failed for user {}: {}", userId, e.getMessage());
                    return Mono.empty();
                })
                .subscribeOn(Schedulers.boundedElastic())
                .subscribe();
    }

    private Mono<Void> send(String token, String title, String body, String link) {
        return Mono.fromCallable(() -> {
            Message.Builder msg = Message.builder()
                    .setToken(token)
                    .setNotification(Notification.builder().setTitle(title).setBody(body).build());
            if (link != null && !link.isBlank()) {
                msg.putAllData(Map.of("link", link));
            }
            firebaseMessaging.send(msg.build());
            return true;
        })
                .subscribeOn(Schedulers.boundedElastic())
                .onErrorResume(e -> {
                    // Prune tokens Firebase rejects as unregistered/invalid.
                    if (e instanceof FirebaseMessagingException fme && isUnregistered(fme)) {
                        return deviceTokenRepository.deleteByToken(token).then(Mono.empty());
                    }
                    log.warn("FCM send failed for token: {}", e.getMessage());
                    return Mono.empty();
                })
                .then();
    }

    private boolean isUnregistered(FirebaseMessagingException e) {
        String code = e.getMessagingErrorCode() != null ? e.getMessagingErrorCode().name() : "";
        return "UNREGISTERED".equals(code) || "INVALID_ARGUMENT".equals(code);
    }
}
