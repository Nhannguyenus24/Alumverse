package com.service.backend.shared.entity;

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
@Table("chat_group_members")
public class ChatGroupMember {

    @Id
    private Long id;

    @Column("group_id")
    private Long groupId;

    @Column("member_id")
    private Long memberId;


    private String role;

    @CreatedDate
    @Column("joined_at")
    private LocalDateTime joinedAt;
}

