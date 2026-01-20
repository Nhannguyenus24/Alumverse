package com.service.common.entity;

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
@Table("learning_resources")
public class LearningResource {

    @Id
    private Long id;

    @Column("organization_id")
    private Long organizationId;

    @Column("uploader_member_id")
    private Long uploaderMemberId;

    private String title;

    private String type;

    @Column("link_url")
    private String linkUrl;

    private String description;

    @CreatedDate
    @Column("created_at")
    private LocalDateTime createdAt;
}
