package com.service.backend.chat.dto;

import jakarta.validation.constraints.NotBlank;


public record UpdateGroupRequest(

        @NotBlank(message = "Title must not be blank")
        String title
) {
}

