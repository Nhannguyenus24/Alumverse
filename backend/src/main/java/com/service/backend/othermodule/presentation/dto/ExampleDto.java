package com.service.backend.othermodule.presentation.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

public class ExampleDto {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class GreetingDto {

        @NotBlank
        @Size(max = 8, message = "Name must not exceed 8 characters")
        private String name;
    }
}
