package com.service.backend.admin.controller;

import com.service.backend.admin.service.AdminMentorshipService;
import com.service.backend.mentorship.dto.MentorshipSessionResponse;
import com.service.backend.shared.dto.ApiResponse;
import com.service.backend.shared.dto.PaginatedResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.Min;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/api/admin/mentorship")
@Validated
@Tag(name = "Admin Mentorship Management", description = "Admin APIs for overseeing mentorship sessions")
public class AdminMentorshipController {

    private final AdminMentorshipService adminMentorshipService;

    public AdminMentorshipController(AdminMentorshipService adminMentorshipService) {
        this.adminMentorshipService = adminMentorshipService;
    }

    @Operation(summary = "List all mentorship sessions (paginated)")
    @GetMapping("/sessions")
    public Mono<ResponseEntity<ApiResponse<PaginatedResponse<MentorshipSessionResponse>>>> getAllSessions(
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(1) int size) {
        return adminMentorshipService.getAllSessions(page, size)
                .map(paginated -> ResponseEntity.ok(new ApiResponse<>("Retrieved all mentorship sessions", paginated)));
    }
}
