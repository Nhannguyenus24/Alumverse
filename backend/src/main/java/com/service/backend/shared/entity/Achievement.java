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

import com.service.backend.shared.enums.Status;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table("achievements")
public class Achievement {

    @Id
    @Column("id")
    private Integer id;

    @Column("organization_id")
    private Integer organizationId;

    @Column("member_id")
    private Integer memberId;

    @Column("title")
    private String title;

    @Column("description")
    private String description;

    @Column("image_url")
    private String imageUrl;

    @Column("url")
    private String url;

    @Column("awarded_date")
    private LocalDate awardedDate;

    @Column("topic")
    private String topic;

    @Column("status")
    private Status status;

    @CreatedDate
    @Column("created_at")
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column("updated_at")
    private LocalDateTime updatedAt;
}
