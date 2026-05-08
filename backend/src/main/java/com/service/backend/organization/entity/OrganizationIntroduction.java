package com.service.backend.organization.entity;

import java.time.LocalDateTime;

import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table("organization_introductions")
public class OrganizationIntroduction {

    @Id
    private Integer id;

    @Column("orga_id")
    private Integer orgaId;

    private String content;

    @Column("image_urls")
    private String imageUrls;

    @Column("updated_at")
    private LocalDateTime updatedAt;
}
