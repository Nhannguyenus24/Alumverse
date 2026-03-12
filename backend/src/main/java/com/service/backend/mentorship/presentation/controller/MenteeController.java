package com.service.backend.mentorship.presentation.controller;

import com.service.backend.mentorship.presentation.dto.request.BookSessionRequest;
import com.service.backend.mentorship.presentation.dto.request.CreateFeedbackRequest;
import com.service.backend.mentorship.presentation.dto.response.*;
import com.service.backend.mentorship.usecase.MenteeService;
import com.service.backend.shared.dto.ApiResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/mentorship/mentee")
@RequiredArgsConstructor
@Validated
public class MenteeController {

    private final MenteeService menteeService;

    @GetMapping("/mentors")
    public Mono<ResponseEntity<ApiResponse<PaginatedResponse<MentorProfileResponse>>>> getApprovedMentors(
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(1) int limit) {
        return menteeService.getApprovedMentors(page, limit)
                .map(response -> ResponseEntity
                        .ok(new ApiResponse<>("Mentors retrieved successfully", response)));
    }

    @GetMapping("/mentors/{mentorMemberId}")
    public Mono<ResponseEntity<ApiResponse<MentorProfileResponse>>> getMentorProfile(
            @PathVariable @Min(1) Integer mentorMemberId) {
        return menteeService.getMentorProfile(mentorMemberId)
                .map(response -> ResponseEntity
                        .ok(new ApiResponse<>("Mentor profile retrieved successfully", response)));
    }

    @GetMapping("/mentors/search")
    public Mono<ResponseEntity<ApiResponse<PaginatedResponse<MentorProfileResponse>>>> searchMentors(
            @RequestParam @NotBlank String keyword,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(1) int limit) {
        return menteeService.searchMentors(keyword, page, limit)
                .map(response -> ResponseEntity
                        .ok(new ApiResponse<>("Search results retrieved successfully", response)));
    }

    @GetMapping("/mentors/filter")
    public Mono<ResponseEntity<ApiResponse<PaginatedResponse<MentorProfileResponse>>>> filterMentors(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String expertise,
            @RequestParam(required = false) BigDecimal minRating,
            @RequestParam(defaultValue = "false") boolean hasAvailability,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(1) int limit) {
        return menteeService.filterMentors(search, expertise, minRating, hasAvailability, page, limit)
                .map(response -> ResponseEntity
                        .ok(new ApiResponse<>("Filtered mentors retrieved successfully", response)));
    }

    @GetMapping("/mentors/{mentorMemberId}/expertise")
    public Mono<ResponseEntity<ApiResponse<List<MentorExpertiseResponse>>>> getMentorExpertise(
            @PathVariable @Min(1) Integer mentorMemberId) {
        return menteeService.getMentorExpertise(mentorMemberId)
                .map(response -> ResponseEntity
                        .ok(new ApiResponse<>("Mentor expertise retrieved successfully", response)));
    }

    @GetMapping("/mentors/{mentorMemberId}/availability")
    public Mono<ResponseEntity<ApiResponse<List<MentorAvailabilityResponse>>>> getMentorAvailableSlots(
            @PathVariable @Min(1) Integer mentorMemberId) {
        return menteeService.getMentorAvailableSlots(mentorMemberId)
                .map(response -> ResponseEntity
                        .ok(new ApiResponse<>("Available slots retrieved successfully", response)));
    }

    @PostMapping("/sessions/book")
    public Mono<ResponseEntity<ApiResponse<MentorshipSessionResponse>>> bookSession(
            @Valid @RequestBody BookSessionRequest request) {
        return menteeService.bookSession(request)
                .map(response -> ResponseEntity
                        .status(HttpStatus.CREATED)
                        .body(new ApiResponse<>("Session booked successfully", response)));
    }

    @GetMapping("/sessions")
    public Mono<ResponseEntity<ApiResponse<PaginatedResponse<MentorshipSessionResponse>>>> getMySessions(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) String mentorName,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(1) int limit) {
        if (date != null || mentorName != null) {
            return menteeService.filterMySessions(date, mentorName, page, limit)
                    .map(response -> ResponseEntity
                            .ok(new ApiResponse<>("Sessions retrieved successfully", response)));
        }
        return menteeService.getMySessions(page, limit)
                .map(response -> ResponseEntity
                        .ok(new ApiResponse<>("Sessions retrieved successfully", response)));
    }

    @GetMapping("/sessions/{sessionId}")
    public Mono<ResponseEntity<ApiResponse<MentorshipSessionResponse>>> getSessionById(
            @PathVariable @Min(1) Integer sessionId) {
        return menteeService.getSessionById(sessionId)
                .map(response -> ResponseEntity
                        .ok(new ApiResponse<>("Session retrieved successfully", response)));
    }

    @PostMapping("/sessions/{sessionId}/cancel")
    public Mono<ResponseEntity<ApiResponse<MentorshipSessionResponse>>> cancelSession(
            @PathVariable @Min(1) Integer sessionId) {
        return menteeService.cancelSession(sessionId)
                .map(response -> ResponseEntity
                        .ok(new ApiResponse<>("Session cancelled successfully", response)));
    }

    @PostMapping("/sessions/{sessionId}/feedback")
    public Mono<ResponseEntity<ApiResponse<SessionFeedbackResponse>>> createFeedback(
            @PathVariable @Min(1) Integer sessionId,
            @Valid @RequestBody CreateFeedbackRequest request) {
        return menteeService.createFeedback(sessionId, request)
                .map(response -> ResponseEntity
                        .status(HttpStatus.CREATED)
                        .body(new ApiResponse<>("Feedback submitted successfully", response)));
    }

    @GetMapping("/mentors/{mentorMemberId}/feedbacks")
    public Mono<ResponseEntity<ApiResponse<PaginatedResponse<SessionFeedbackResponse>>>> getMentorFeedbacks(
            @PathVariable @Min(1) Integer mentorMemberId,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(1) int limit) {
        return menteeService.getMentorFeedbacks(mentorMemberId, page, limit)
                .map(response -> ResponseEntity
                        .ok(new ApiResponse<>("Feedbacks retrieved successfully", response)));
    }
}
