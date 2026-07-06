package com.service.backend.shared.entity;

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
@Table("mentor_skills")
public class MentorSkill {

    @Id
    private Integer id;

    @Column("mentor_member_id")
    private Integer mentorMemberId;

    @Column("skill_id")
    private Integer skillId;

    @Column("display_order")
    private Integer displayOrder;
}
