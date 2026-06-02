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
@Table("mentor_expertise")
public class MentorExpertise {

    @Id
    private Integer id;

    @Column("mentor_member_id")
    private Integer mentorMemberId;

    private String topic;

    @Column("years_experience")
    private Integer yearsExperience;

    private String description;

    private String category;

    private String tag;
}
