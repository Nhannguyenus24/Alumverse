package com.service.backend.shared.entity;

import java.time.LocalDateTime;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table("forum_topic_subscriptions")
public class ForumTopicSubscription {
    
    @Id
    private Integer id;
    
    @Column("topic_id")
    private Integer topicId;
    
    @Column("member_id")
    private Integer memberId;
    
    @Column("last_read_at")
    private LocalDateTime lastReadAt;
    
    @Column("last_notified_at")
    private LocalDateTime lastNotifiedAt;
    
    @CreatedDate
    @Column("created_at")
    private LocalDateTime createdAt;
}
