package com.service.backend.user.entity;

import java.time.LocalDateTime;

import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
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
