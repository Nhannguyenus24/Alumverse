package com.service.backend.fundraising.dao.repository;

import com.service.backend.fundraising.entity.Funds;
import lombok.RequiredArgsConstructor;
import org.springframework.r2dbc.core.DatabaseClient;
import org.springframework.r2dbc.core.DatabaseClient.GenericExecuteSpec;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Repository
@RequiredArgsConstructor
public class FundQueryRepository {

    private final DatabaseClient databaseClient;

    public Flux<Funds> findFiltered(
            Integer organizationId,
            Integer statusId,
            String keyword,
            LocalDateTime timeStartedFrom,
            LocalDateTime timeStartedTo,
            BigDecimal targetAmountMin,
            BigDecimal targetAmountMax,
            boolean sortByDonorCount,
            boolean sortAsc,
            int limit,
            int offset
    ) {
        StringBuilder sql = new StringBuilder("SELECT * FROM funds");
        Map<String, Object> params = new HashMap<>();
        List<String> where = new ArrayList<>();

        if (organizationId != null) {
            where.add("organization_id = :organizationId");
            params.put("organizationId", organizationId);
        }
        if (statusId != null) {
            where.add("status_id = :statusId");
            params.put("statusId", statusId);
        }
        if (keyword != null && !keyword.isBlank()) {
            where.add("(LOWER(name) LIKE LOWER(CONCAT('%', :q, '%')))");
            params.put("q", keyword.trim());
        }
        if (timeStartedFrom != null && timeStartedTo != null) {
            where.add("time_started BETWEEN :tsFrom AND :tsTo");
            params.put("tsFrom", timeStartedFrom);
            params.put("tsTo", timeStartedTo);
        }
        if (targetAmountMin != null && targetAmountMax != null) {
            where.add("target_amount BETWEEN :amtMin AND :amtMax");
            params.put("amtMin", targetAmountMin);
            params.put("amtMax", targetAmountMax);
        }
        if (!where.isEmpty()) {
            sql.append(" WHERE ").append(String.join(" AND ", where));
        }
        if (sortByDonorCount) {
            sql.append(" ORDER BY donor_count ").append(sortAsc ? "ASC" : "DESC");
        }
        sql.append(" LIMIT :limit OFFSET :offset");
        params.put("limit", limit);
        params.put("offset", offset);

        GenericExecuteSpec spec = databaseClient.sql(sql.toString());
        for (Map.Entry<String, Object> entry : params.entrySet()) {
            spec = spec.bind(entry.getKey(), entry.getValue());
        }
        return spec.map((row, meta) -> {
                    Funds f = new Funds();
                    f.setId(row.get("id", Integer.class));
                    f.setOrganizationId(row.get("organization_id", Integer.class));
                    f.setManagerName(row.get("manager_name", String.class));
                    f.setName(row.get("name", String.class));
                    f.setLogoUrl(row.get("logo_url", String.class));
                    f.setFundReceivingInfoId(row.get("fund_receiving_info_id", Integer.class));
                    f.setDescriptionShort(row.get("description_short", String.class));
                    f.setDescriptionFull(row.get("description_full", String.class));
                    f.setTargetAmount(row.get("target_amount", BigDecimal.class));
                    f.setCurrentAmount(row.get("current_amount", BigDecimal.class));
                    f.setTimeStarted(row.get("time_started", LocalDateTime.class));
                    f.setDonorCount(row.get("donor_count", Integer.class));
                    f.setStatusId(row.get("status_id", Integer.class));
                    f.setTimeEnded(row.get("time_ended", LocalDateTime.class));
                    return f;
                })
                .all();
    }

    public Mono<Long> countFiltered(
            Integer organizationId,
            Integer statusId,
            String keyword,
            LocalDateTime timeStartedFrom,
            LocalDateTime timeStartedTo,
            BigDecimal targetAmountMin,
            BigDecimal targetAmountMax
    ) {
        StringBuilder sql = new StringBuilder("SELECT COUNT(*) AS cnt FROM funds");
        Map<String, Object> params = new HashMap<>();
        List<String> where = new ArrayList<>();

        if (organizationId != null) {
            where.add("organization_id = :organizationId");
            params.put("organizationId", organizationId);
        }
        if (statusId != null) {
            where.add("status_id = :statusId");
            params.put("statusId", statusId);
        }
        if (keyword != null && !keyword.isBlank()) {
            where.add("(LOWER(name) LIKE LOWER(CONCAT('%', :q, '%')))");
            params.put("q", keyword.trim());
        }
        if (timeStartedFrom != null && timeStartedTo != null) {
            where.add("time_started BETWEEN :tsFrom AND :tsTo");
            params.put("tsFrom", timeStartedFrom);
            params.put("tsTo", timeStartedTo);
        }
        if (targetAmountMin != null && targetAmountMax != null) {
            where.add("target_amount BETWEEN :amtMin AND :amtMax");
            params.put("amtMin", targetAmountMin);
            params.put("amtMax", targetAmountMax);
        }
        if (!where.isEmpty()) {
            sql.append(" WHERE ").append(String.join(" AND ", where));
        }

        GenericExecuteSpec spec = databaseClient.sql(sql.toString());
        for (Map.Entry<String, Object> entry : params.entrySet()) {
            spec = spec.bind(entry.getKey(), entry.getValue());
        }
        return spec.map((row, meta) -> row.get("cnt", Long.class)).one();
    }
}

