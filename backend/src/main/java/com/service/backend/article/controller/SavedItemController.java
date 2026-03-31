package com.service.backend.article.controller;

import com.service.backend.article.dto.SaveItemRequest;
import com.service.backend.shared.dto.PaginatedResponse;
import com.service.backend.article.dto.SavedCheckResponse;
import com.service.backend.article.dto.SavedItemResponse;
import com.service.backend.article.usecase.SavedItemService;
import com.service.backend.shared.dto.ApiResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/api/articles/saved")
@RequiredArgsConstructor
@Validated
public class SavedItemController {

    private final SavedItemService savedItemService;

    @PostMapping
    public Mono<ResponseEntity<ApiResponse<SavedItemResponse>>> saveItem(@Valid @RequestBody SaveItemRequest request) {
        return savedItemService.saveItem(request)
                .map(response -> ResponseEntity
                        .status(HttpStatus.CREATED)
                        .body(new ApiResponse<>("Item saved successfully", response)));
    }

    @DeleteMapping
    public Mono<ResponseEntity<ApiResponse<Void>>> unsaveItem(
            @RequestParam @NotBlank String itemType,
            @RequestParam @NotNull Integer itemId) {
        return savedItemService.unsaveItem(itemType, itemId)
                .map(deleted -> ResponseEntity
                        .ok(new ApiResponse<>("Item unsaved successfully", null)));
    }

    @GetMapping("/check")
    public Mono<ResponseEntity<ApiResponse<SavedCheckResponse>>> checkSaved(
            @RequestParam @NotBlank String itemType,
            @RequestParam @NotNull Integer itemId) {
        return savedItemService.checkSaved(itemType, itemId)
                .map(response -> ResponseEntity
                        .ok(new ApiResponse<>("Saved status retrieved successfully", response)));
    }

    @GetMapping
    public Mono<ResponseEntity<ApiResponse<PaginatedResponse<SavedItemResponse>>>> getMySavedItems(
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(1) int limit) {
        return savedItemService.getMySavedItems(page, limit)
                .map(response -> ResponseEntity
                        .ok(new ApiResponse<>("Saved items retrieved successfully", response)));
    }

    @GetMapping("/type/{itemType}")
    public Mono<ResponseEntity<ApiResponse<PaginatedResponse<SavedItemResponse>>>> getMySavedItemsByType(
            @PathVariable @NotBlank String itemType,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(1) int limit) {
        return savedItemService.getMySavedItemsByType(itemType, page, limit)
                .map(response -> ResponseEntity
                        .ok(new ApiResponse<>("Saved items by type retrieved successfully", response)));
    }
}
