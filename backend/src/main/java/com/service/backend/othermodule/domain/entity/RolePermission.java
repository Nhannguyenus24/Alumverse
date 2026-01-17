package com.service.backend.othermodule.domain.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table("role_permissions")
public class RolePermission {

    @Column("role_id")
    private Long roleId;

    @Column("permission_id")
    private Long permissionId;
}
