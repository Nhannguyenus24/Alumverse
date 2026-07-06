package com.service.backend.article.dto;

import com.service.backend.shared.enums.Status;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.relational.core.mapping.Column;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AchievementDetailDTO {
    private Integer id;
    
    @Column("member_id")
    private Integer memberId;
    
    private String title;
    private String description;
    
    @Column("image_url")
    private String imageUrl;
    
    @Column("url")
    private String url;
    
    @Column("awarded_date")
    private LocalDate awardedDate;
    
    private String topic;
    private Status status;
    
    @Column("member_name")
    private String memberName;
    
    @Column("member_avatar")
    private String memberAvatar;
    
    @Column("member_job_title")
    private String memberJobTitle;
    
    @Column("member_company")
    private String memberCompany;
}
