package com.service.backend.shared.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table("fitbot_knowledge_documents")
public class FitBotKnowledgeDocument {

    @Id
    private Long id;

    @Column("source_name")
    private String sourceName;

    private String title;

    private String content;

    private Boolean enabled;

    @Column("sync_status")
    private String syncStatus;

    @Column("sync_error")
    private String syncError;

    @Column("last_synced_at")
    private LocalDateTime lastSyncedAt;

    @Column("created_at")
    private LocalDateTime createdAt;

    @Column("updated_at")
    private LocalDateTime updatedAt;

    @Column("updated_by")
    private Long updatedBy;
}
