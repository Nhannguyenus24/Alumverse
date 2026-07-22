package com.service.backend.article.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SaveItemRequest {

    @NotBlank
    @Size(max = 255)

    private String itemType;

    @NotNull
    @NotNull

    @Min(value = 1)

    private Integer itemId;

    @Size(max = 255)


    private String note;
}
