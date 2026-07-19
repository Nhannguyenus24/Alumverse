package com.service.backend.event.controller;

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

import com.service.backend.event.dto.CreateEventCommentRequest;
import com.service.backend.event.dto.EventCommentDTO;
import com.service.backend.event.dto.UpdateEventCommentRequest;
import com.service.backend.event.service.EventCommentService;
import com.service.backend.shared.annotations.PublicEndpoint;
import com.service.backend.shared.dto.ApiResponse;
import com.service.backend.shared.dto.PaginatedResponse;

import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import reactor.core.publisher.Mono;

@Tag(name = "Event > Comments", description = "API endpoints for event comments")
@RestController
@RequestMapping("/api/events/{eventId}/comments")
@Validated
public class EventCommentController {

    private final EventCommentService eventCommentService;

    public EventCommentController(EventCommentService eventCommentService) {
        this.eventCommentService = eventCommentService;
    }

    @PublicEndpoint
    @GetMapping
    public Mono<ResponseEntity<ApiResponse<PaginatedResponse<EventCommentDTO>>>> getComments(
            @PathVariable @Min(value = 1, message = "Event ID must be greater than 0") Long eventId,
            @RequestParam(defaultValue = "0") @Min(value = 0, message = "Page must be greater than or equal to 0") int page,
            @RequestParam(defaultValue = "20") @Min(value = 1, message = "Size must be greater than 0") int size) {
        return eventCommentService.findCommentsByEventId(eventId, page, size)
                .map(response -> ResponseEntity.ok(new ApiResponse<>("Comments retrieved successfully", response)));
    }

    @PostMapping
    public Mono<ResponseEntity<ApiResponse<EventCommentDTO>>> createComment(
            @PathVariable @Min(value = 1, message = "Event ID must be greater than 0") Long eventId,
            @Valid @RequestBody CreateEventCommentRequest request) {
        request.setEventId(eventId);
        return eventCommentService.createComment(request)
                .map(comment -> ResponseEntity.status(HttpStatus.CREATED).body(new ApiResponse<>("Comment created successfully", comment)));
    }

    @PostMapping("/{commentId}/reply")
    public Mono<ResponseEntity<ApiResponse<EventCommentDTO>>> replyToComment(
            @PathVariable @Min(value = 1, message = "Event ID must be greater than 0") Long eventId,
            @PathVariable @Min(value = 1, message = "Comment ID must be greater than 0") Integer commentId,
            @Valid @RequestBody CreateEventCommentRequest request) {
        request.setEventId(eventId);
        return eventCommentService.replyToComment(commentId, request)
                .map(comment -> ResponseEntity.status(HttpStatus.CREATED).body(new ApiResponse<>("Reply posted successfully", comment)));
    }

    @PutMapping("/{commentId}")
    public Mono<ResponseEntity<ApiResponse<EventCommentDTO>>> updateComment(
            @PathVariable @Min(value = 1, message = "Event ID must be greater than 0") Long eventId,
            @PathVariable @Min(value = 1, message = "Comment ID must be greater than 0") Integer commentId,
            @Valid @RequestBody UpdateEventCommentRequest request) {
        return eventCommentService.updateComment(commentId, request)
                .map(comment -> ResponseEntity.ok(new ApiResponse<>("Comment updated successfully", comment)));
    }

    @DeleteMapping("/{commentId}")
    public Mono<ResponseEntity<ApiResponse<Void>>> deleteComment(
            @PathVariable @Min(value = 1, message = "Event ID must be greater than 0") Long eventId,
            @PathVariable @Min(value = 1, message = "Comment ID must be greater than 0") Integer commentId) {
        return eventCommentService.deleteComment(commentId)
                .thenReturn(ResponseEntity.ok(new ApiResponse<>("Comment deleted successfully", null)));
    }
}
