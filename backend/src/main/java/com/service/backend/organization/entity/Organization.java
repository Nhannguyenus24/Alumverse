package com.service.backend.organization.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;
import com.fasterxml.jackson.databind.JsonNode;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table("organizations")
public class Organization {

    @Id
    private Integer id;

    private String name;

    private String slug;

    @Column("logo_url")
    private String logoUrl;

    @Column("brand_config")
    private String brandConfig;

    @Column("features_config")
    private String featuresConfig;

    @Column("created_at")
    @CreatedDate
    private LocalDateTime createdAt;
}