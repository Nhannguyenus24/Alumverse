package com.service.backend.chat.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateGroupRequest {

    @Size(max = 100, message = "Group title must not exceed 100 characters")
    @Size(max = 255)

    private String title;

    @NotNull(message = "Member IDs are required")
    @NotEmpty(message = "Member IDs must not be empty")
    @Size(max = 100)

    private List<Long> memberIds;
}
