package com.service.backend.chat.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;


public record CreateGroupRequest(

        @NotNull(message = "Member IDs are required")
        @NotEmpty(message = "Member IDs must not be empty")
        List<Long> memberIds
) {
}

