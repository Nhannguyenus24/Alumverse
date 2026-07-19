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

import com.service.backend.article.dto.AlumniPostCommentDTO;
import com.service.backend.article.dto.CreateAlumniPostCommentRequest;
import com.service.backend.article.dto.UpdateAlumniPostCommentRequest;
import com.service.backend.article.service.AlumniPostCommentService;
import com.service.backend.shared.annotations.PublicEndpoint;
import com.service.backend.shared.dto.ApiResponse;
import com.service.backend.shared.dto.PaginatedResponse;

import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import reactor.core.publisher.Mono;

@Tag(name = "Article > Alumni Post Comments", description = "API endpoints for alumni post comments")
@RestController
@RequestMapping("/api/articles/alumni-posts/{alumniPostId}/comments")
@Validated
public class AlumniPostCommentController {

    private final AlumniPostCommentService alumniPostCommentService;

    public AlumniPostCommentController(AlumniPostCommentService alumniPostCommentService) {
        this.alumniPostCommentService = alumniPostCommentService;
    }

    @PublicEndpoint
    @GetMapping
    public Mono<ResponseEntity<ApiResponse<PaginatedResponse<AlumniPostCommentDTO>>>> getComments(
            @PathVariable @Min(value = 1, message = "Alumni post ID must be greater than 0") Integer alumniPostId,
            @RequestParam(defaultValue = "0") @Min(value = 0, message = "Page must be greater than or equal to 0") int page,
            @RequestParam(defaultValue = "20") @Min(value = 1, message = "Size must be greater than 0") int size) {
        return alumniPostCommentService.findCommentsByAlumniPostId(alumniPostId, page, size)
                .map(response -> ResponseEntity.ok(new ApiResponse<>("Comments retrieved successfully", response)));
    }

    @PostMapping
    public Mono<ResponseEntity<ApiResponse<AlumniPostCommentDTO>>> createComment(
            @PathVariable @Min(value = 1, message = "Alumni post ID must be greater than 0") Integer alumniPostId,
            @Valid @RequestBody CreateAlumniPostCommentRequest request) {
        request.setAlumniPostId(alumniPostId);
        return alumniPostCommentService.createComment(request)
                .map(comment -> ResponseEntity.status(HttpStatus.CREATED).body(new ApiResponse<>("Comment created successfully", comment)));
    }

    @PostMapping("/{commentId}/reply")
    public Mono<ResponseEntity<ApiResponse<AlumniPostCommentDTO>>> replyToComment(
            @PathVariable @Min(value = 1, message = "Alumni post ID must be greater than 0") Integer alumniPostId,
            @PathVariable @Min(value = 1, message = "Comment ID must be greater than 0") Integer commentId,
            @Valid @RequestBody CreateAlumniPostCommentRequest request) {
        request.setAlumniPostId(alumniPostId);
        return alumniPostCommentService.replyToComment(commentId, request)
                .map(comment -> ResponseEntity.status(HttpStatus.CREATED).body(new ApiResponse<>("Reply posted successfully", comment)));
    }

    @PutMapping("/{commentId}")
    public Mono<ResponseEntity<ApiResponse<AlumniPostCommentDTO>>> updateComment(
            @PathVariable @Min(value = 1, message = "Alumni post ID must be greater than 0") Integer alumniPostId,
            @PathVariable @Min(value = 1, message = "Comment ID must be greater than 0") Integer commentId,
            @Valid @RequestBody UpdateAlumniPostCommentRequest request) {
        return alumniPostCommentService.updateComment(commentId, request)
                .map(comment -> ResponseEntity.ok(new ApiResponse<>("Comment updated successfully", comment)));
    }

    @DeleteMapping("/{commentId}")
    public Mono<ResponseEntity<ApiResponse<Void>>> deleteComment(
            @PathVariable @Min(value = 1, message = "Alumni post ID must be greater than 0") Integer alumniPostId,
            @PathVariable @Min(value = 1, message = "Comment ID must be greater than 0") Integer commentId) {
        return alumniPostCommentService.deleteComment(commentId)
                .thenReturn(ResponseEntity.ok(new ApiResponse<>("Comment deleted successfully", null)));
    }
}
