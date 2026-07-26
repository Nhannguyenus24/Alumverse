package com.service.backend.shared.cronjob;

import com.service.backend.forum.dao.ForumPostRepository;
import com.service.backend.shared.enums.ForumPostTag;
import com.service.backend.shared.entity.ForumPost;
import com.service.backend.shared.service.AITagService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;
import java.util.concurrent.TimeUnit;
import io.micrometer.core.instrument.MeterRegistry;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
@Slf4j
@ConditionalOnProperty(name = "forum.post.tag.enabled", havingValue = "true", matchIfMissing = true)
public class ForumPostTagScheduler {

    private final ForumPostRepository forumPostRepository;
    private final AITagService aiTagService;
    private final MeterRegistry meterRegistry;

    @Value("${forum.post.tag.interval.hours:24}")
    private int intervalHours;

    @Value("${gemini.tagging.enabled:true}")
    private boolean taggingEnabled;

    @Value("${gemini.tagging.max-posts-per-run:100}")
    private int maxPostsPerRun;

    @Scheduled(cron = "${forum.post.tag.cron:0 0 3 * * *}")
    public void tagRecentForumPosts() {
        long startTime = System.currentTimeMillis();
        if (!taggingEnabled) {
            log.info("START/END: Gemini tagging is disabled. Skipping scheduled job at {}", LocalDateTime.now());
            return;
        }

        log.info("START: Starting scheduled job at {}: Tagging forum posts from the last {} hours", LocalDateTime.now(), intervalHours);

        forumPostRepository.findPostsCreatedSince(LocalDateTime.now().minusHours(intervalHours))
                .collectList()
                .flatMap(allPosts -> {
                    if (allPosts.isEmpty()) {
                        log.info("No new forum posts found in the last {} hours.", intervalHours);
                        return Mono.just(Collections.<ForumPost>emptyList());
                    }

                    List<ForumPost> posts = allPosts.stream().limit(maxPostsPerRun).collect(Collectors.toList());
                    if (allPosts.size() > maxPostsPerRun) {
                        log.info("Found {} posts, but capped at {} for this run.", allPosts.size(), maxPostsPerRun);
                    } else {
                        log.info("Found {} posts to tag.", posts.size());
                    }
                    
                    List<String> contents = posts.stream()
                            .map(ForumPost::getContent)
                            .collect(Collectors.toList());

                    return aiTagService.tagContents(contents, ForumPostTag.getAllTagsAsString())
                            .collectList()
                            .flatMap(tags -> {
                                if (tags.size() != posts.size()) {
                                    log.error("Tag count ({}) does not match post count ({}).", tags.size(), posts.size());
                                    return Mono.just(Collections.<ForumPost>emptyList());
                                }

                                for (int i = 0; i < posts.size(); i++) {
                                    posts.get(i).setAiTag(tags.get(i));
                                }

                                return forumPostRepository.saveAll(posts).collectList();
                            });
                })
                .doOnSuccess(savedPosts -> {
                    long endTime = System.currentTimeMillis();
                    int count = (savedPosts != null) ? savedPosts.size() : 0;
                    meterRegistry.timer("cronjob.execution.time", "job_name", "ForumPostTag", "status", "success").record(endTime - startTime, TimeUnit.MILLISECONDS);
                    log.info("END (SUCCESS): Successfully tagged and saved {} forum posts at {}. Duration: {} ms", count, LocalDateTime.now(), endTime - startTime);
                })
                .onErrorResume(error -> {
                    long endTime = System.currentTimeMillis();
                    meterRegistry.timer("cronjob.execution.time", "job_name", "ForumPostTag", "status", "error").record(endTime - startTime, TimeUnit.MILLISECONDS);
                    log.error("END (ERROR): Error occurred while tagging forum posts at {}. Duration: {} ms", LocalDateTime.now(), endTime - startTime, error);
                    return Mono.empty();
                })
                .subscribe();
    }
}
