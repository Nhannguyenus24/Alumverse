package com.service.backend.shared.projection;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LoginMethodProjection {
    private String method;
    private Long count;
}
