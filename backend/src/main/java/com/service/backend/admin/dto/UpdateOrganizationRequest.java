package com.service.backend.admin.dto;

import com.service.backend.shared.enums.Status;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateOrganizationRequest {
    
    @Size(max = 255, message = "Name must not exceed 255 characters")
    private String name;

    @Size(max = 255, message = "Slug must not exceed 255 characters")
    private String slug;

    private String logoUrl;
    
    private Status status;
    
    private List<String> programs;
    
    private List<String> majors;
    
    private String featuresConfig;

    @Size(max = 50, message = "Contact phone must not exceed 50 characters")
    private String contactPhone;

    @Email(message = "Contact email must be a valid email address")
    @Size(max = 255, message = "Contact email must not exceed 255 characters")
    private String contactEmail;

    @Size(max = 255, message = "Department name must not exceed 255 characters")
    private String departmentName;
}
