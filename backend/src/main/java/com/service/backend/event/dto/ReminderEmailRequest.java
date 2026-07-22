package com.service.backend.event.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

@Data
public class ReminderEmailRequest {

    @NotBlank(message = "Tiêu đề email không được trống")
    @Size(max = 255)

    private String subject;

    @NotBlank(message = "Nội dung email không được trống")
    @Size(max = 255)

    private String body;

    @Size(max = 100)


    private List<Long> ticketIds;
}
