package com.service.backend.event.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Data
public class BulkApproveRequest {

    @NotEmpty(message = "Danh sách ticket ID không được trống")
    private List<Long> ticketIds;
}
