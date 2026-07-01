package com.service.backend.forum.service;

import com.service.backend.forum.dao.*;
import com.service.backend.forum.dto.*;
import com.service.backend.shared.dao.UserDisplayInfoRepository;
import com.service.backend.shared.entity.*;
import com.service.backend.shared.enums.ErrorCode;
import com.service.backend.shared.enums.Status;
import com.service.backend.shared.exception.ApplicationException;
import com.service.backend.shared.utils.CacheUtils;
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
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("ForumService Unit Tests")
class ForumServiceTest {

    @Mock private ForumCategoryRepository forumCategoryRepository;
    @Mock private ForumTopicRepository forumTopicRepository;
    @Mock private ForumPostRepository forumPostRepository;
    @Mock private ForumPostReactionRepository forumPostReactionRepository;
    @Mock private ForumPostReportRepository forumPostReportRepository;
    @Mock private ForumTopicSubscriptionRepository forumTopicSubscriptionRepository;
    @Mock private UserDisplayInfoRepository userDisplayInfoRepository;
    @Mock private CacheUtils cacheUtils;

    @InjectMocks
    private ForumService forumService;

    // ─── findCategoryById ─────────────────────────────────────────────────────

    @Nested
    @DisplayName("findCategoryById()")
    class FindCategoryById {

        @Test
        @DisplayName("should return category when found")
        void findCategoryById_success() {
            ForumCategory category = ForumCategory.builder()
                    .id(1)
                    .name("General")
                    .description("General discussions")
                    .status("ACTIVE")
                    .parentId(null)
                    .build();

            when(forumCategoryRepository.findById(1)).thenReturn(Mono.just(category));

            StepVerifier.create(forumService.findCategoryById(1))
                    .assertNext(dto -> assertThat(dto.getName()).isEqualTo("General"))
                    .verifyComplete();
        }

        @Test
        @DisplayName("should fail when category not found")
        void findCategoryById_notFound() {
            when(forumCategoryRepository.findById(99)).thenReturn(Mono.empty());

            StepVerifier.create(forumService.findCategoryById(99))
                    .expectErrorMatches(err -> err instanceof ApplicationException &&
                            ((ApplicationException) err).getErrorCode() == ErrorCode.FORUM_CATEGORY_NOT_FOUND)
                    .verify();
        }
    }

    // ─── createCategory ───────────────────────────────────────────────────────

    @Nested
    @DisplayName("createCategory()")
    class CreateCategory {

        @Test
        @DisplayName("should create category successfully")
        void createCategory_success() {
            CreateForumCategoryRequest request = new CreateForumCategoryRequest();
            request.setName("Tech");
            request.setDescription("Technology topics");
            request.setOrganizationId(1);

            ForumCategory saved = ForumCategory.builder()
                    .id(1)
                    .name("Tech")
                    .description("Technology topics")
                    .organizationId(1)
                    .status("ACTIVE")
                    .parentId(null)
                    .build();

            when(forumCategoryRepository.save(any())).thenReturn(Mono.just(saved));
            when(cacheUtils.clear("forum_category_cache")).thenReturn(Mono.empty());

            StepVerifier.create(forumService.createCategory(request))
                    .assertNext(dto -> {
                        assertThat(dto.getName()).isEqualTo("Tech");
                        assertThat(dto.getStatus()).isEqualTo("ACTIVE");
                    })
                    .verifyComplete();
        }
    }

    // ─── updateCategory ───────────────────────────────────────────────────────

    @Nested
    @DisplayName("updateCategory()")
    class UpdateCategory {

        @Test
        @DisplayName("should update category successfully")
        void updateCategory_success() {
            ForumCategory existing = ForumCategory.builder()
                    .id(1)
                    .name("Old Name")
                    .description("Old Desc")
                    .status("ACTIVE")
                    .parentId(null)
                    .build();

            UpdateForumCategoryRequest request = new UpdateForumCategoryRequest();
            request.setName("New Name");

            ForumCategory updated = ForumCategory.builder()
                    .id(1)
                    .name("New Name")
                    .description("Old Desc")
                    .status("ACTIVE")
                    .parentId(null)
                    .build();

            when(forumCategoryRepository.findById(1)).thenReturn(Mono.just(existing));
            when(forumCategoryRepository.save(any())).thenReturn(Mono.just(updated));
            when(cacheUtils.clear("forum_category_cache")).thenReturn(Mono.empty());

            StepVerifier.create(forumService.updateCategory(1, request))
                    .assertNext(dto -> assertThat(dto.getName()).isEqualTo("New Name"))
                    .verifyComplete();
        }

        @Test
        @DisplayName("should fail when category not found")
        void updateCategory_notFound() {
            UpdateForumCategoryRequest request = new UpdateForumCategoryRequest();
            request.setName("New Name");

            when(forumCategoryRepository.findById(99)).thenReturn(Mono.empty());

            StepVerifier.create(forumService.updateCategory(99, request))
                    .expectErrorMatches(err -> err instanceof ApplicationException &&
                            ((ApplicationException) err).getErrorCode() == ErrorCode.FORUM_CATEGORY_NOT_FOUND)
                    .verify();
        }
    }

    // ─── createTopic ─────────────────────────────────────────────────────────

    @Nested
    @DisplayName("createTopic()")
    class CreateTopic {

        @Test
        @DisplayName("should create topic successfully")
        void createTopic_success() {
            ForumCategory category = ForumCategory.builder().id(1).name("General").build();
            CreateForumTopicRequest request = new CreateForumTopicRequest();
            request.setCategoryId(1);
            request.setTitle("My Topic");
            request.setOrganizationId(1);
            request.setCreatedByMemberId(1);

            ForumTopic savedTopic = ForumTopic.builder()
                    .id(1)
                    .title("My Topic")
                    .categoryId(1)
                    .status(Status.PENDING.name())
                    .createdAt(LocalDateTime.now())
                    .build();

            when(forumCategoryRepository.findById(1)).thenReturn(Mono.just(category));
            when(forumTopicRepository.save(any())).thenReturn(Mono.just(savedTopic));
            when(forumPostRepository.countByTopicId(1)).thenReturn(Mono.just(0L));
            when(cacheUtils.clear("forum_category_cache")).thenReturn(Mono.empty());

            StepVerifier.create(forumService.createTopic(request))
                    .assertNext(dto -> {
                        assertThat(dto.getTitle()).isEqualTo("My Topic");
                        assertThat(dto.getStatus()).isEqualTo(Status.PENDING.name());
                    })
                    .verifyComplete();
        }

        @Test
        @DisplayName("should fail when category not found")
        void createTopic_categoryNotFound() {
            CreateForumTopicRequest request = new CreateForumTopicRequest();
            request.setCategoryId(99);
            request.setTitle("My Topic");

            when(forumCategoryRepository.findById(99)).thenReturn(Mono.empty());

            StepVerifier.create(forumService.createTopic(request))
                    .expectErrorMatches(err -> err instanceof ApplicationException &&
                            ((ApplicationException) err).getErrorCode() == ErrorCode.FORUM_CATEGORY_NOT_FOUND)
                    .verify();
        }
    }

    // ─── createPost ──────────────────────────────────────────────────────────

    @Nested
    @DisplayName("createPost()")
    class CreatePost {

        @Test
        @DisplayName("should fail when topic ID is null/invalid")
        void createPost_invalidTopicId() {
            CreateForumPostRequest request = new CreateForumPostRequest();
            request.setTopicId(null);
            request.setContent("Hello");

            StepVerifier.create(forumService.createPost(request))
                    .expectErrorMatches(err -> err instanceof ApplicationException &&
                            ((ApplicationException) err).getErrorCode() == ErrorCode.INVALID_TOPIC_ID)
                    .verify();
        }

        @Test
        @DisplayName("should fail when topic not found")
        void createPost_topicNotFound() {
            CreateForumPostRequest request = new CreateForumPostRequest();
            request.setTopicId(99);
            request.setContent("Hello");

            when(forumTopicRepository.findById(99)).thenReturn(Mono.empty());

            StepVerifier.create(forumService.createPost(request))
                    .expectErrorMatches(err -> err instanceof ApplicationException &&
                            ((ApplicationException) err).getErrorCode() == ErrorCode.FORUM_TOPIC_NOT_FOUND)
                    .verify();
        }

        @Test
        @DisplayName("should fail when topic is locked (inactive)")
        void createPost_topicLocked() {
            ForumTopic lockedTopic = ForumTopic.builder()
                    .id(1)
                    .title("Locked Topic")
                    .status(Status.INACTIVE.name())
                    .createdByMemberId(10)
                    .build();

            CreateForumPostRequest request = new CreateForumPostRequest();
            request.setTopicId(1);
            request.setContent("Hello");
            request.setAuthorMemberId(5);

            when(forumTopicRepository.findById(1)).thenReturn(Mono.just(lockedTopic));

            StepVerifier.create(forumService.createPost(request))
                    .expectErrorMatches(err -> err instanceof ApplicationException &&
                            ((ApplicationException) err).getErrorCode() == ErrorCode.FORUM_TOPIC_LOCKED)
                    .verify();
        }

        @Test
        @DisplayName("should create post successfully in active topic")
        void createPost_success() {
            ForumTopic activeTopic = ForumTopic.builder()
                    .id(1)
                    .title("Active Topic")
                    .status(Status.ACTIVE.name())
                    .createdByMemberId(10)
                    .build();

            ForumPost savedPost = ForumPost.builder()
                    .id(1)
                    .topicId(1)
                    .content("Hello World")
                    .authorMemberId(5)
                    .isBanned(false)
                    .isHidden(false)
                    .createdAt(LocalDateTime.now())
                    .build();

            CreateForumPostRequest request = new CreateForumPostRequest();
            request.setTopicId(1);
            request.setContent("Hello World");
            request.setAuthorMemberId(5);

            when(forumTopicRepository.findById(1)).thenReturn(Mono.just(activeTopic));
            when(forumPostRepository.save(any())).thenReturn(Mono.just(savedPost));
            when(cacheUtils.putWithTtl(anyString(), anyString(), any(), any())).thenReturn(Mono.empty());

            StepVerifier.create(forumService.createPost(request))
                    .assertNext(dto -> {
                        assertThat(dto.getContent()).isEqualTo("Hello World");
                        assertThat(dto.getTopicId()).isEqualTo(1);
                    })
                    .verifyComplete();
        }
    }

    // ─── updatePost ──────────────────────────────────────────────────────────

    @Nested
    @DisplayName("updatePost()")
    class UpdatePost {

        @Test
        @DisplayName("should update post successfully")
        void updatePost_success() {
            ForumPost existingPost = ForumPost.builder()
                    .id(1)
                    .topicId(1)
                    .content("Old Content")
                    .authorMemberId(5)
                    .build();

            ForumPost updatedPost = ForumPost.builder()
                    .id(1)
                    .topicId(1)
                    .content("New Content")
                    .authorMemberId(5)
                    .build();

            UpdateForumPostRequest request = new UpdateForumPostRequest();
            request.setContent("New Content");

            when(forumPostRepository.findById(1)).thenReturn(Mono.just(existingPost));
            when(forumPostRepository.save(any())).thenReturn(Mono.just(updatedPost));

            StepVerifier.create(forumService.updatePost(1, request))
                    .assertNext(dto -> assertThat(dto.getContent()).isEqualTo("New Content"))
                    .verifyComplete();
        }

        @Test
        @DisplayName("should fail when post not found")
        void updatePost_notFound() {
            UpdateForumPostRequest request = new UpdateForumPostRequest();
            request.setContent("New Content");

            when(forumPostRepository.findById(99)).thenReturn(Mono.empty());

            StepVerifier.create(forumService.updatePost(99, request))
                    .expectErrorMatches(err -> err instanceof ApplicationException &&
                            ((ApplicationException) err).getErrorCode() == ErrorCode.FORUM_POST_NOT_FOUND)
                    .verify();
        }
    }

    // ─── deletePost ──────────────────────────────────────────────────────────

    @Nested
    @DisplayName("deletePost()")
    class DeletePost {

        @Test
        @DisplayName("should delete post successfully")
        void deletePost_success() {
            ForumPost post = ForumPost.builder().id(1).topicId(1).build();

            when(forumPostRepository.findById(1)).thenReturn(Mono.just(post));
            when(forumPostReactionRepository.deleteByPostId(1)).thenReturn(Mono.empty());
            when(forumPostRepository.deleteById(1)).thenReturn(Mono.empty());

            StepVerifier.create(forumService.deletePost(1))
                    .verifyComplete();
        }

        @Test
        @DisplayName("should fail when post not found")
        void deletePost_notFound() {
            when(forumPostRepository.findById(99)).thenReturn(Mono.empty());

            StepVerifier.create(forumService.deletePost(99))
                    .expectErrorMatches(err -> err instanceof ApplicationException &&
                            ((ApplicationException) err).getErrorCode() == ErrorCode.FORUM_POST_NOT_FOUND)
                    .verify();
        }
    }

    // ─── getPostReactionCounts ────────────────────────────────────────────────

    @Nested
    @DisplayName("getPostReactionCounts()")
    class GetPostReactionCounts {

        @Test
        @DisplayName("should return reaction counts")
        void getPostReactionCounts_success() {
            when(forumPostReactionRepository.countByPostId(1)).thenReturn(Mono.just(5L));

            StepVerifier.create(forumService.getPostReactionCounts(1))
                    .assertNext(map -> assertThat(map.get("likes")).isEqualTo(5L))
                    .verifyComplete();
        }
    }

    // ─── isSubscribed ─────────────────────────────────────────────────────────

    @Nested
    @DisplayName("isSubscribed()")
    class IsSubscribed {

        @Test
        @DisplayName("should return true when subscribed")
        void isSubscribed_true() {
            ForumTopicSubscription sub = ForumTopicSubscription.builder().id(1).topicId(1).memberId(1).build();

            when(forumTopicSubscriptionRepository.findByTopicIdAndMemberId(1, 1)).thenReturn(Mono.just(sub));

            StepVerifier.create(forumService.isSubscribed(1, 1))
                    .assertNext(result -> assertThat(result).isTrue())
                    .verifyComplete();
        }

        @Test
        @DisplayName("should return false when not subscribed")
        void isSubscribed_false() {
            when(forumTopicSubscriptionRepository.findByTopicIdAndMemberId(1, 99)).thenReturn(Mono.empty());

            StepVerifier.create(forumService.isSubscribed(1, 99))
                    .assertNext(result -> assertThat(result).isFalse())
                    .verifyComplete();
        }
    }
}
