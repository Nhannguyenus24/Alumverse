package com.service.backend.shared.cronjob;

import com.service.backend.forum.dao.ForumPostRepository;
import com.service.backend.shared.enums.ForumPostTag;
import com.service.backend.shared.entity.ForumPost;
import com.service.backend.shared.service.AITagService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
@Slf4j
public class ForumPostTagScheduler {

    private final ForumPostRepository forumPostRepository;
    private final AITagService aiTagService;

    @Value("${forum.post.tag.interval.hours:12}")
    private int intervalHours;

    @Scheduled(cron = "${forum.post.tag.cron:0 0 0 * * ?}")
    public void tagRecentForumPosts() {
        log.info("Starting scheduled job: Tagging forum posts from the last {} hours", intervalHours);

        forumPostRepository.findPostsCreatedSince(LocalDateTime.now().minusHours(intervalHours))
                .collectList()
                .flatMap(posts -> {
                    if (posts.isEmpty()) {
                        log.info("No new forum posts found in the last {} hours.", intervalHours);
                        return Mono.just(Collections.<ForumPost>emptyList());
                    }

                    log.info("Found {} posts to tag.", posts.size());
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
                    if (savedPosts != null && !savedPosts.isEmpty()) {
                        log.info("Successfully tagged and saved {} forum posts.", savedPosts.size());
                    }
                })
                .doOnError(error -> log.error("Error occurred while tagging forum posts: ", error))
                .subscribe();
    }
}
