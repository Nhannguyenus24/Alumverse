package com.service.backend.admin.dto;

import com.service.backend.shared.enums.Status;
import com.service.backend.shared.enums.UserRole;
import jakarta.validation.constraints.Email;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateUserRequest {
    @Email(message = "Invalid email format")
    private String email;
    private String userName;
    private UserRole role;
    private Status status;
    /** Display name stored in global_profiles (upserted when non-blank). */
    private String fullName;
    /** Moves the user's primary membership (lowest organization_members.id) or creates one. */
    private Integer organizationId;
}
