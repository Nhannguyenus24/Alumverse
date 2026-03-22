package com.service.backend.admin.dto;

import java.util.List;

import com.service.backend.admin.entities.Organization;
import com.service.backend.shared.dto.PageInfo;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OrganizationPageResponse {
    private List<Organization> data;
    private PageInfo pageInfo;
}
