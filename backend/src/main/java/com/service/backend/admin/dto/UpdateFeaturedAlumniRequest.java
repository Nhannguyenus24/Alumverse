package com.service.backend.admin.dto;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateFeaturedAlumniRequest {
    @Valid
    @Size(max = 8)
    private List<Item> alumni;

    @Data
    public static class Item {
        @NotNull
        private Integer userId;

        private Integer displayOrder;

        @Size(max = 500)
        private String note;
    }
}
