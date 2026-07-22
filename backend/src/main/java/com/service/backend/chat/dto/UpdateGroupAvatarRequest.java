package com.service.backend.chat.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateGroupAvatarRequest {

    @NotBlank(message = "Avatar URL must not be blank")
    private String avatarUrl;
}
