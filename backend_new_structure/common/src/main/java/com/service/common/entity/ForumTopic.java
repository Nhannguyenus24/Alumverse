package com.service.common.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table("forum_topics")
public class ForumTopic {

    @Id
    private Long id;

    @Column("organization_id")
    private Long organizationId;

    private String title;

    @Column("created_by_member_id")
    private Long createdByMemberId;
}
