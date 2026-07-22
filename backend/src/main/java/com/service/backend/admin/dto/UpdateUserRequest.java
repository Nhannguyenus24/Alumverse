package com.service.backend.admin.dto;

import com.service.backend.shared.enums.Status;
import com.service.backend.shared.enums.UserRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Min;
import java.time.LocalDate;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateUserRequest {
    @Email(message = "Invalid email format")
    @Size(max = 255)

    private String email;
    @Size(max = 255)

    private String studentId;
    private UserRole role;
    private Status status;
    /** Display name stored on users.full_name (updated when non-blank). */
    @Size(max = 255)

    private String fullName;
    @Size(max = 255)

    private String phone;
    private LocalDate dob;
    @Size(max = 255)

    private String gender;
    @Size(max = 255)

    private String password;
    /** Moves the user's primary membership (lowest organization_members.id) or creates one. */
    @NotNull

    @Min(value = 1)

    private Integer organizationId;
    @Size(max = 100)

    private List<String> faculty;
    @Size(max = 100)

    private List<String> startedYear;
    @Size(max = 100)

    private List<Integer> graduatedYear;
    @Size(max = 100)

    private List<String> graduationStatus;
    @Size(max = 100)

    private List<String> program;
    @Size(max = 100)

    private List<String> major;
    @Size(max = 100)

    private List<String> department;
    @Min(value = 0, message = "Verification level must be at least 0")
    private Integer verificationLevel;
    private Boolean isTrustedVerifier;
    private Boolean requirePasswordChange;
}
