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
@Table("saved_items")
public class SavedItem {

    @Id
    private Long id;

    @Column("member_id")
    private Long memberId;

    @Column("item_type")
    private String itemType;

    @Column("item_id")
    private Integer itemId;

    private String note;

    @CreatedDate
    @Column("saved_at")
    private LocalDateTime savedAt;
}
