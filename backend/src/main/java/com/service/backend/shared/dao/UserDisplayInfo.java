package com.service.backend.shared.dao;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDisplayInfo {
    private Integer userId;
    private String fullName;
    private String avatarUrl;
    private String coverUrl;
    private String currentJobTitle;
    private String currentCompany;
}
