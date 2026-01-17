package com.service.backend.domain.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table("organizations")
public class Organization {

    @Id
    private Long id;

    private String name;

    private String slug;

    @Column("logo_url")
    private String logoUrl;

    @Column("brand_config")
    private String brandConfig; // JSON stored as String

    @Column("features_config")
    private String featuresConfig; // JSON stored as String

    @CreatedDate
    @Column("created_at")
    private LocalDateTime createdAt;
}
