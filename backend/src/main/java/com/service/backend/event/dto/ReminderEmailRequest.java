package com.service.backend.event.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.List;

@Data
public class ReminderEmailRequest {

    @NotBlank(message = "Tiêu đề email không được trống")
    private String subject;

    @NotBlank(message = "Nội dung email không được trống")
    private String body;

    private List<Long> ticketIds;
}
