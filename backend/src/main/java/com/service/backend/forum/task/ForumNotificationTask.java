package com.service.backend.forum.task;

import com.github.benmanes.caffeine.cache.Cache;
import com.service.backend.forum.dao.ForumTopicRepository;
import com.service.backend.forum.dao.ForumTopicSubscriptionRepository;
import com.service.backend.shared.entity.ForumTopicSubscription;
import com.service.backend.user.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;

import java.time.LocalDateTime;
import java.util.Set;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class ForumNotificationTask {
    private static final Logger log = LoggerFactory.getLogger(ForumNotificationTask.class);

    private final ForumTopicSubscriptionRepository forumTopicSubscriptionRepository;
    private final ForumTopicRepository forumTopicRepository;
    private final NotificationService notificationService;
    private final Cache<String, LocalDateTime> forumRecentPostsCache;

    @Scheduled(cron = "0 0 */3 * * *")
    public void sendForumNotifications() {
        log.info("Starting ForumNotificationTask...");

        Set<Integer> activeTopicIds = forumRecentPostsCache.asMap().keySet().stream()
                .map(key -> Integer.parseInt(key.split(":")[0]))
                .collect(Collectors.toSet());

        // Narrow query to topics with known recent activity; fall back to full scan after a restart
        Flux<ForumTopicSubscription> candidates = activeTopicIds.isEmpty()
                ? forumTopicSubscriptionRepository.findSubscriptionsWithNewPosts()
                : forumTopicSubscriptionRepository.findSubscriptionsWithNewPostsInTopics(activeTopicIds);

        candidates
                .flatMap(subscription -> forumTopicRepository.findById(subscription.getTopicId())
                        .flatMap(topic -> {
                            String title = "New updates in Topic: " + topic.getTitle();
                            String message = "There are new comments in the topic you subscribed to. Check it out!";

                            notificationService.createNotificationAsync(subscription.getMemberId(), title, message);

                            return forumTopicSubscriptionRepository
                                    .updateLastNotifiedAt(subscription.getId(), LocalDateTime.now());
                        })
                )
                .doOnError(error -> log.error("Error in ForumNotificationTask", error))
                .doOnComplete(() -> log.info("Finished ForumNotificationTask"))
                .subscribe();
    }
}
