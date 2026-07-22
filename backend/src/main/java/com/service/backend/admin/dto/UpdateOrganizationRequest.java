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
    @Size(max = 255)

    private String name;

    @Size(max = 255, message = "Slug must not exceed 255 characters")
    @Size(max = 255)

    private String slug;

    @Size(max = 255)


    private String logoUrl;
    
    private Status status;
    
    @Size(max = 100)

    
    private List<String> programs;
    
    @Size(max = 100)

    
    private List<String> majors;
    
    @Size(max = 255)

    
    private String featuresConfig;

    @Size(max = 50, message = "Contact phone must not exceed 50 characters")
    @Size(max = 255)

    private String contactPhone;

    @Email(message = "Contact email must be a valid email address")
    @Size(max = 255, message = "Contact email must not exceed 255 characters")
    @Size(max = 255)

    private String contactEmail;

    @Size(max = 255, message = "Department name must not exceed 255 characters")
    @Size(max = 255)

    private String departmentName;
}
