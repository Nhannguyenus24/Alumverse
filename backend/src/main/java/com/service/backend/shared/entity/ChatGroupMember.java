package com.service.backend.shared.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import com.service.backend.shared.enums.ChatRole;
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


    private ChatRole role;

    @CreatedDate
    @Column("joined_at")
    private LocalDateTime joinedAt;

    @Column("last_read_at")
    private LocalDateTime lastReadAt;
}

