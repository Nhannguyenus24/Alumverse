package com.service.backend.shared.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BatchModerationResponse {
    private List<String> tags; // List of tags corresponding to input list: SENSITIVE, OFFENSIVE, NORMAL
}
