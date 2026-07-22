package com.service.backend.admin.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BulkCreateOrganizationMembersRequest {

    @NotNull(message = "Organization ID is required")
    @NotNull

    @Min(value = 1)

    private Integer organizationId;

    @NotNull(message = "Members list is required")
    @Size(min = 1, max = 500, message = "Members list must have between 1 and 500 entries")
    @Size(max = 100)

    private List<MemberEntry> members;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MemberEntry {
        @Size(max = 255)

        private String email;
        @Size(max = 255)

        private String fullName;
        @Size(max = 255)

        private String studentId;
        @Builder.Default
        private String role = "USER";
        @Size(max = 255)

        private String password;
        @Size(max = 255)

        private String program;
        @Size(max = 255)

        private String major;
        /** Năm tốt nghiệp (single value, wrapped into array on server side) */
        private Integer graduatedYear;
        /** STUDYING | GRADUATED | DROPPED */
        @Size(max = 255)

        private String graduationStatus;
        @Builder.Default
        private Integer verificationLevel = 0;
        @Builder.Default
        private Boolean isTrustedVerifier = false;
        @Builder.Default
        private String status = "ACTIVE";
    }
}
