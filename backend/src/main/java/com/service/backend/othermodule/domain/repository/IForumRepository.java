package com.service.backend.othermodule.domain.repository;

import com.service.backend.othermodule.domain.entity.ForumTopic;
import com.service.backend.othermodule.domain.entity.ForumPost;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Map;

/**
 * Repository interface for forum Q&A operations
 */
public interface IForumRepository {

    // Topic Management
    Mono<ForumTopic> createTopic(ForumTopic topicData);
    Mono<ForumTopic> updateTopic(Long topicId, ForumTopic topicData);
    Mono<Boolean> deleteTopic(Long topicId);
    Mono<ForumTopic> findTopicById(Long topicId);
    Mono<Map<String, Object>> findTopicsByOrganization(Long organizationId, int page, int limit);

    // Post Management
    Mono<ForumPost> createPost(ForumPost postData);
    Mono<ForumPost> updatePost(Long postId, ForumPost postData);
    Mono<Boolean> deletePost(Long postId);
    Mono<ForumPost> findPostById(Long postId);
    Mono<Map<String, Object>> findPostsByTopic(Long topicId, int page, int limit);
    Mono<Map<String, Object>> findPostsByAuthor(Long authorMemberId, int page, int limit);

    // Search & Filter
    Mono<Map<String, Object>> searchPosts(Long organizationId, String keyword, int page, int limit);
    Flux<ForumPost> findRecentPosts(Long organizationId, int limit);

    // Statistics
    Mono<Long> countPostsByTopic(Long topicId);
    Mono<Map<String, Object>> getTopicStatistics(Long topicId);
}
