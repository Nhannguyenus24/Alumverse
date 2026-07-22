package com.service.backend.fundraising.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateFundDonationRequest {

    @NotNull
    @Min(1)
    @Schema(example = "1")
    private Integer fundId;

    @Min(1)
    @JsonProperty("donor_member_id")
    @Schema(example = "123")
    private Integer donorMemberId;

    @Size(max = 50)
    @JsonProperty("donor_name")
    @Schema(example = "Nguyễn Văn A")
    private String donorName;

    @NotNull
    @DecimalMin(value = "0.01", message = "Amount must be greater than 0")
    @Schema(example = "50000.00")
    private BigDecimal amount;

    @Size(max = 500)
    @Schema(example = "123 Đường ABC, Quận 1")
    private String address;

    @Size(max = 50)
    @Schema(example = "0901234567")
    private String phone;

    @Size(max = 255)
    @Schema(example = "nguyenvana@example.com")
    private String email;

    @Size(max = 100) // Already checked that the bank allow max 119, i left 19 character left for fund donation id
    @Schema(example = "Chúc các bạn nhận được học bổng!")
    private String message;
}

