package com.service.backend.article.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.service.backend.article.dto.CreateNewsCommentRequest;
import com.service.backend.article.dto.NewsCommentDTO;
import com.service.backend.article.dto.UpdateNewsCommentRequest;
import com.service.backend.article.service.NewsCommentService;
import com.service.backend.shared.annotations.PublicEndpoint;
import com.service.backend.shared.dto.ApiResponse;
import com.service.backend.shared.dto.PaginatedResponse;

import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import reactor.core.publisher.Mono;

@Tag(name = "Article > News Comments", description = "API endpoints for news comments")
@RestController
@RequestMapping("/api/articles/news/{newsId}/comments")
@Validated
public class NewsCommentController {

    private final NewsCommentService newsCommentService;

    public NewsCommentController(NewsCommentService newsCommentService) {
        this.newsCommentService = newsCommentService;
    }

    @PublicEndpoint
    @GetMapping
    public Mono<ResponseEntity<ApiResponse<PaginatedResponse<NewsCommentDTO>>>> getComments(
            @PathVariable @Min(value = 1, message = "News ID must be greater than 0") Integer newsId,
            @RequestParam(defaultValue = "0") @Min(value = 0, message = "Page must be greater than or equal to 0") int page,
            @RequestParam(defaultValue = "20") @Min(value = 1, message = "Size must be greater than 0") int size) {
        return newsCommentService.findCommentsByNewsId(newsId, page, size)
                .map(response -> ResponseEntity.ok(new ApiResponse<>("Comments retrieved successfully", response)));
    }

    @PostMapping
    public Mono<ResponseEntity<ApiResponse<NewsCommentDTO>>> createComment(
            @PathVariable @Min(value = 1, message = "News ID must be greater than 0") Integer newsId,
            @Valid @RequestBody CreateNewsCommentRequest request) {
        request.setNewsId(newsId);
        return newsCommentService.createComment(request)
                .map(comment -> ResponseEntity.status(HttpStatus.CREATED).body(new ApiResponse<>("Comment created successfully", comment)));
    }

    @PostMapping("/{commentId}/reply")
    public Mono<ResponseEntity<ApiResponse<NewsCommentDTO>>> replyToComment(
            @PathVariable @Min(value = 1, message = "News ID must be greater than 0") Integer newsId,
            @PathVariable @Min(value = 1, message = "Comment ID must be greater than 0") Integer commentId,
            @Valid @RequestBody CreateNewsCommentRequest request) {
        request.setNewsId(newsId);
        return newsCommentService.replyToComment(commentId, request)
                .map(comment -> ResponseEntity.status(HttpStatus.CREATED).body(new ApiResponse<>("Reply posted successfully", comment)));
    }

    @PutMapping("/{commentId}")
    public Mono<ResponseEntity<ApiResponse<NewsCommentDTO>>> updateComment(
            @PathVariable @Min(value = 1, message = "News ID must be greater than 0") Integer newsId,
            @PathVariable @Min(value = 1, message = "Comment ID must be greater than 0") Integer commentId,
            @Valid @RequestBody UpdateNewsCommentRequest request) {
        return newsCommentService.updateComment(commentId, request)
                .map(comment -> ResponseEntity.ok(new ApiResponse<>("Comment updated successfully", comment)));
    }

    @DeleteMapping("/{commentId}")
    public Mono<ResponseEntity<ApiResponse<Void>>> deleteComment(
            @PathVariable @Min(value = 1, message = "News ID must be greater than 0") Integer newsId,
            @PathVariable @Min(value = 1, message = "Comment ID must be greater than 0") Integer commentId) {
        return newsCommentService.deleteComment(commentId)
                .thenReturn(ResponseEntity.ok(new ApiResponse<>("Comment deleted successfully", null)));
    }
}
