package com.service.backend.othermodule.domain.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table("achievements")
public class Achievement {

    @Id
    private Long id;

    @Column("member_id")
    private Long memberId;

    private String title;

    private String description;

    @Column("image_url")
    private String imageUrl;

    @Column("awarded_date")
    private LocalDate awardedDate;

    private String status;
}
