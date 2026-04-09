package com.service.backend.fundraising.dto;

import java.util.List;
import lombok.Data;

@Data
public class BanksPayloadDto {
    private List<BankInfoDto> data;
}
