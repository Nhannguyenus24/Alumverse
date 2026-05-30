package com.service.backend.chat.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AddMembersRequest {

    @NotNull(message = "Member IDs are required")
    @NotEmpty(message = "Member IDs must not be empty")
    private List<Long> memberIds;
}
