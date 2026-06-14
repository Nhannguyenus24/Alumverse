package com.service.backend.user.controller;

import com.service.backend.shared.dto.ApiResponse;
import com.service.backend.shared.annotations.PublicEndpoint;
import com.service.backend.user.dto.UserProfileResponse;
import com.service.backend.user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;
import io.swagger.v3.oas.annotations.tags.Tag;

@Tag(name = "Users > Public Directory", description = "API endpoints for public user directory and profiles")
@RestController
@RequestMapping("/api/users")
@Validated
@RequiredArgsConstructor
public class PublicUserController {
    private final UserService userService;

    @PublicEndpoint
    @GetMapping("/{userId}/public-profile")
    public Mono<ResponseEntity<ApiResponse<UserProfileResponse>>> getPublicProfile(@PathVariable Integer userId) {
        return userService.getPublicProfile(userId)
                .map(profile -> ResponseEntity.ok(new ApiResponse<>("Public profile retrieved successfully", profile)));
    }
}
