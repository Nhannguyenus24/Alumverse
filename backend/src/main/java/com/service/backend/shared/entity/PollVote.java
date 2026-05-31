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
@Table("forum_poll_votes")
public class PollVote {
    
    @Id
    private Integer id;
    
    @Column("poll_id")
    private Integer pollId;
    
    @Column("poll_option_id")
    private Integer pollOptionId;
    
    @Column("member_id")
    private Integer memberId;
    
    @CreatedDate
    @Column("created_at")
    private LocalDateTime createdAt;
}
