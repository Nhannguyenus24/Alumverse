package com.service.backend.shared.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
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
    @Column("id")
    private Integer id;

    @Column("member_id")
    private Integer memberId;

    @Column("item_type")
    private String itemType;

    @Column("item_id")
    private Integer itemId;

    @Column("note")
    private String note;

    @Column("saved_at")
    private LocalDateTime savedAt;
}
