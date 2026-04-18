package com.service.backend.fundraising.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class BankInfoDto {
    private String name;

    @JsonProperty("short_name")
    private String shortName;

    private String code;
    
    private Boolean supported;
}
