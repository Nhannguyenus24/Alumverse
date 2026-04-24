package com.service.backend.admin.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table("user_login_histories")
public class UserLoginHistory {

    @Id
    private Long id;

    @Column("user_id")
    private Integer userId;

    @Column("login_at")
    private LocalDateTime loginAt;

    @Column("login_method")
    private String loginMethod;

    @Column("login_ip")
    private String loginIp;

    @Column("user_agent")
    private String userAgent;
}
