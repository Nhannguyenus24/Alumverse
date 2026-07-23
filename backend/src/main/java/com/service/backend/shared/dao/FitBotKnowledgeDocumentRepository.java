package com.service.backend.shared.dao;

import com.service.backend.shared.entity.FitBotKnowledgeDocument;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;

@Repository
public interface FitBotKnowledgeDocumentRepository extends R2dbcRepository<FitBotKnowledgeDocument, Long> {

    Flux<FitBotKnowledgeDocument> findAllByOrderByUpdatedAtDesc();

    Flux<FitBotKnowledgeDocument> findByEnabledTrueOrderByUpdatedAtDesc();

    @Query("SELECT * FROM fitbot_knowledge_documents WHERE sync_status <> :syncStatus ORDER BY updated_at ASC")
    Flux<FitBotKnowledgeDocument> findBySyncStatusNotOrderByUpdatedAtAsc(String syncStatus);
}
