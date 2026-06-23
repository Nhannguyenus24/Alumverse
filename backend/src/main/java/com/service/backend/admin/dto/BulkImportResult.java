package com.service.backend.admin.dto;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BulkImportResult {

    private int total;
    private int successCount;
    private int failureCount;
    private List<RowResult> results;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RowResult {
        private int rowIndex;
        private String email;
        private String fullName;
        private String studentId;
        /** "SUCCESS" | "FAILED" | "SKIPPED" */
        private String status;
        private String reason;
    }
}
