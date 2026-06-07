package com.service.backend.mentorship.controller;

import com.service.backend.mentorship.dto.*;
import com.service.backend.shared.dto.PaginatedResponse;
import com.service.backend.mentorship.service.MentorService;
import com.service.backend.shared.dto.ApiResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/mentorship/mentor")
@RequiredArgsConstructor
@Validated
public class MentorController {

    private final MentorService mentorService;

    @PostMapping("/profile")
    public Mono<ResponseEntity<ApiResponse<MentorProfileResponse>>> createProfile(
            @Valid @RequestBody CreateMentorProfileRequest request) {
        return mentorService.createProfile(request)
                .map(response -> ResponseEntity
                        .status(HttpStatus.CREATED)
                        .body(new ApiResponse<>("Mentor profile created successfully", response)));
    }

    @PostMapping("/profile/draft")
    public Mono<ResponseEntity<ApiResponse<MentorProfileResponse>>> saveDraft(
            @Valid @RequestBody CreateMentorProfileRequest request) {
        return mentorService.saveDraft(request)
                .map(response -> ResponseEntity
                        .ok(new ApiResponse<>("Mentor profile draft saved", response)));
    }

    @PutMapping("/profile")
    public Mono<ResponseEntity<ApiResponse<MentorProfileResponse>>> updateProfile(
            @Valid @RequestBody UpdateMentorProfileRequest request) {
        return mentorService.updateProfile(request)
                .map(response -> ResponseEntity
                        .ok(new ApiResponse<>("Mentor profile updated successfully", response)));
    }

    @GetMapping("/profile")
    public Mono<ResponseEntity<ApiResponse<MentorProfileResponse>>> getMyProfile() {
        return mentorService.getMyProfile()
                .map(response -> ResponseEntity
                        .ok(new ApiResponse<>("Mentor profile retrieved successfully", response)));
    }

    @PostMapping("/expertise")
    public Mono<ResponseEntity<ApiResponse<MentorExpertiseResponse>>> addExpertise(
            @Valid @RequestBody CreateExpertiseRequest request) {
        return mentorService.addExpertise(request)
                .map(response -> ResponseEntity
                        .status(HttpStatus.CREATED)
                        .body(new ApiResponse<>("Expertise added successfully", response)));
    }

    @GetMapping("/expertise")
    public Mono<ResponseEntity<ApiResponse<List<MentorExpertiseResponse>>>> getMyExpertise() {
        return mentorService.getMyExpertise()
                .map(response -> ResponseEntity
                        .ok(new ApiResponse<>("Expertise retrieved successfully", response)));
    }

    @PutMapping("/expertise/{id}")
    public Mono<ResponseEntity<ApiResponse<MentorExpertiseResponse>>> updateExpertise(
            @PathVariable @Min(1) Integer id,
            @Valid @RequestBody UpdateExpertiseRequest request) {
        return mentorService.updateExpertise(id, request)
                .map(response -> ResponseEntity
                        .ok(new ApiResponse<>("Expertise updated successfully", response)));
    }

    @DeleteMapping("/expertise/{id}")
    public Mono<ResponseEntity<ApiResponse<Void>>> deleteExpertise(@PathVariable @Min(1) Integer id) {
        return mentorService.deleteExpertise(id)
                .map(deleted -> ResponseEntity
                        .ok(new ApiResponse<>("Expertise deleted successfully", null)));
    }

    @PostMapping("/availability")
    public Mono<ResponseEntity<ApiResponse<MentorAvailabilityResponse>>> addAvailability(
            @Valid @RequestBody CreateAvailabilityRequest request) {
        return mentorService.addAvailability(request)
                .map(response -> ResponseEntity
                        .status(HttpStatus.CREATED)
                        .body(new ApiResponse<>("Availability added successfully", response)));
    }

    @GetMapping("/availability")
    public Mono<ResponseEntity<ApiResponse<List<MentorAvailabilityResponse>>>> getMyAvailabilities() {
        return mentorService.getMyAvailabilities()
                .map(response -> ResponseEntity
                        .ok(new ApiResponse<>("Availabilities retrieved successfully", response)));
    }

    @PutMapping("/availability/{id}")
    public Mono<ResponseEntity<ApiResponse<MentorAvailabilityResponse>>> updateAvailability(
            @PathVariable @Min(1) Integer id,
            @Valid @RequestBody CreateAvailabilityRequest request) {
        return mentorService.updateAvailability(id, request)
                .map(response -> ResponseEntity
                        .ok(new ApiResponse<>("Availability updated successfully", response)));
    }

    @DeleteMapping("/availability/{id}")
    public Mono<ResponseEntity<ApiResponse<Void>>> deleteAvailability(@PathVariable @Min(1) Integer id) {
        return mentorService.deleteAvailability(id)
                .map(deleted -> ResponseEntity
                        .ok(new ApiResponse<>("Availability deleted successfully", null)));
    }

    @GetMapping("/sessions")
    public Mono<ResponseEntity<ApiResponse<PaginatedResponse<MentorshipSessionResponse>>>> getMySessions(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) String menteeName,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(1) int limit) {
        if (date != null || menteeName != null) {
            return mentorService.filterMySessions(date, menteeName, page, limit)
                    .map(response -> ResponseEntity
                            .ok(new ApiResponse<>("Sessions retrieved successfully", response)));
        }
        return mentorService.getMySessions(page, limit)
                .map(response -> ResponseEntity
                        .ok(new ApiResponse<>("Sessions retrieved successfully", response)));
    }

    @PostMapping("/sessions/{sessionId}/cancel")
    public Mono<ResponseEntity<ApiResponse<MentorshipSessionResponse>>> cancelSession(
            @PathVariable @Min(1) Integer sessionId,
            @org.springframework.web.bind.annotation.RequestParam(required = false) String cancelReason) {
        return mentorService.cancelSession(sessionId, cancelReason)
                .map(response -> ResponseEntity
                        .ok(new ApiResponse<>("Session cancelled successfully", response)));
    }

    @PostMapping("/sessions/{sessionId}/postpone")
    public Mono<ResponseEntity<ApiResponse<MentorshipSessionResponse>>> postponeSession(
            @PathVariable @Min(1) Integer sessionId,
            @org.springframework.web.bind.annotation.RequestParam(required = false) String reason) {
        return mentorService.postponeSession(sessionId, reason)
                .map(response -> ResponseEntity
                        .ok(new ApiResponse<>("Session postponed successfully", response)));
    }

    @PutMapping("/sessions/{sessionId}/status")
    public Mono<ResponseEntity<ApiResponse<MentorshipSessionResponse>>> updateSessionStatus(
            @PathVariable @Min(1) Integer sessionId,
            @Valid @RequestBody UpdateSessionStatusRequest request) {
        return mentorService.updateSessionStatus(sessionId, request)
                .map(response -> ResponseEntity
                        .ok(new ApiResponse<>("Session status updated successfully", response)));
    }

    @GetMapping("/feedbacks")
    public Mono<ResponseEntity<ApiResponse<PaginatedResponse<SessionFeedbackResponse>>>> getMyFeedbacks(
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(1) int limit) {
        return mentorService.getMyFeedbacks(page, limit)
                .map(response -> ResponseEntity
                        .ok(new ApiResponse<>("Feedbacks retrieved successfully", response)));
    }
}
