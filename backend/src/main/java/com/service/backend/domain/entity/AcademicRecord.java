package com.service.backend.domain.entity;

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
@Table("academic_records")
public class AcademicRecord {

    @Id
    private Long id;

    @Column("member_id")
    private Long memberId;

    @Column("student_code")
    private String studentCode;

    @Column("degree_type")
    private String degreeType;

    @Column("class_name")
    private String className;

    @Column("start_year")
    private Integer startYear;

    @Column("graduated_year")
    private Integer graduatedYear;

    private String status;
}
