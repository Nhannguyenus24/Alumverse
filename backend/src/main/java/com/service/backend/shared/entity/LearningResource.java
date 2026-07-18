package com.service.backend.shared.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import com.service.backend.shared.enums.LearningResourceType;
import com.service.backend.shared.enums.Status;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table("learning_resources")
public class LearningResource {

    @Id
    @Column("id")
    private Integer id;

    @Column("organization_id")
    private Integer organizationId;

    @Column("uploader_member_id")
    private Integer uploaderMemberId;

    @Column("title")
    private String title;

    @Column("type")
    private LearningResourceType type;

    @Column("link_url")
    private String linkUrl;

    @Column("description")
    private String description;

    @Column("thumbnail_url")
    private String thumbnailUrl;

    @Column("status")
    private Status status;

    @CreatedDate
    @Column("created_at")
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column("updated_at")
    private LocalDateTime updatedAt;
}
