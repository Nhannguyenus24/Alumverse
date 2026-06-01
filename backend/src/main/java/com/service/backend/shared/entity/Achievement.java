package com.service.backend.shared.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import com.service.backend.shared.enums.Status;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table("achievements")
public class Achievement {

    @Id
    @Column("id")
    private Integer id;

    @Column("member_id")
    private Integer memberId;

    @Column("title")
    private String title;

    @Column("description")
    private String description;

    @Column("image_url")
    private String imageUrl;

    @Column("awarded_date")
    private LocalDate awardedDate;

    @Column("topic")
    private String topic;

    @Column("status")
    private Status status;
}
