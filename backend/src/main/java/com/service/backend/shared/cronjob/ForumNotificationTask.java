package com.service.backend.shared.cronjob;

import com.service.backend.shared.utils.CacheNames;
import com.service.backend.shared.utils.CacheUtils;
import com.service.backend.forum.dao.ForumTopicRepository;
import com.service.backend.forum.dao.ForumTopicSubscriptionRepository;
import com.service.backend.shared.entity.ForumTopic;
import com.service.backend.shared.entity.ForumTopicSubscription;
import com.service.backend.user.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;
import java.util.concurrent.TimeUnit;
import io.micrometer.core.instrument.MeterRegistry;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "forum.notification.enabled", havingValue = "true", matchIfMissing = true)
public class ForumNotificationTask {
    private static final Logger log = LoggerFactory.getLogger(ForumNotificationTask.class);

    private final ForumTopicSubscriptionRepository forumTopicSubscriptionRepository;
    private final ForumTopicRepository forumTopicRepository;
    private final NotificationService notificationService;
    private final CacheUtils cacheUtils;
    private final MeterRegistry meterRegistry;

    @Scheduled(cron = "0 0 */12 * * *")
    public void sendForumNotifications() {
        long startTime = System.currentTimeMillis();
        log.info("START: Starting ForumNotificationTask at {}", LocalDateTime.now());

        cacheUtils.getKeys(CacheNames.FORUM_RECENT_POSTS)
                .flatMapMany(keys -> {
                    // Keys are now plain topicIds (no postId suffix)
                    Set<Integer> activeTopicIds = keys.stream()
                            .map(Integer::parseInt)
                            .collect(Collectors.toSet());

                    // Narrow query to topics with known recent activity; fall back to full scan after a restart
                    return activeTopicIds.isEmpty()
                            ? forumTopicSubscriptionRepository.findSubscriptionsWithNewPosts()
                            : forumTopicSubscriptionRepository.findSubscriptionsWithNewPostsInTopics(activeTopicIds);
                })
                .collectList()
                .flatMap(subscriptions -> {
                    if (subscriptions.isEmpty()) return Mono.empty();

                    Set<Integer> topicIds = subscriptions.stream()
                            .map(ForumTopicSubscription::getTopicId)
                            .collect(Collectors.toSet());

                    // Batch load all topics in a single query instead of N individual findById calls
                    return forumTopicRepository.findAllById(topicIds)
                            .collectMap(ForumTopic::getId)
                            .flatMap((Map<Integer, ForumTopic> topicMap) -> {
                                java.util.List<Integer> subIdsToUpdate = new java.util.ArrayList<>();
                                for (ForumTopicSubscription subscription : subscriptions) {
                                    ForumTopic topic = topicMap.get(subscription.getTopicId());
                                    if (topic != null) {
                                        String title = "New updates in forum topic: " + topic.getTitle();
                                        String message = "There are new comments in the topic you subscribed to. Check it out!";
                                        String link = "/forum/topics/" + topic.getId();

                                        notificationService.createNotificationAsync(subscription.getMemberId(), title, message, link);
                                        subIdsToUpdate.add(subscription.getId());
                                    }
                                }
                                if (subIdsToUpdate.isEmpty()) return Mono.empty();
                                return forumTopicSubscriptionRepository.updateLastNotifiedAtBatch(subIdsToUpdate, LocalDateTime.now())
                                        .thenReturn(subIdsToUpdate.size());
                            });
                })
                .doOnSuccess(count -> {
                    long endTime = System.currentTimeMillis();
                    meterRegistry.timer("cronjob.execution.time", "job_name", "ForumNotification", "status", "success").record(endTime - startTime, TimeUnit.MILLISECONDS);
                    log.info("END (SUCCESS): Forum notification summary job finished at {}. Summarized {} post(s). Duration: {} ms", LocalDateTime.now(), count, endTime - startTime);
                })
                .onErrorResume(e -> {
                    long endTime = System.currentTimeMillis();
                    meterRegistry.timer("cronjob.execution.time", "job_name", "ForumNotification", "status", "error").record(endTime - startTime, TimeUnit.MILLISECONDS);
                    log.error("END (ERROR): Error in ForumNotificationTask at {}. Duration: {} ms", LocalDateTime.now(), endTime - startTime, e);
                    return Mono.empty();
                }).subscribe();
    }
}
