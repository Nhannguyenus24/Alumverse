package com.service.backend.admin.entities;

import java.time.LocalDateTime;

import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Table("organizations")
public class Organization {
    
    @Id
    private Integer id;
    
    private String name;
    
    private String slug;
    
    @Column("logo_url")
    private String logoUrl;
    
    @Column("brand_config")
    private String brandConfig;
    
    @Column("features_config")
    private String featuresConfig;
    
    @Column("created_at")
    private LocalDateTime createdAt;
}
