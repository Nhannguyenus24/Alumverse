package com.service.backend.eventmodule.presentation.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RegisterTicketRequest {

    private String guestName;

    private String guestEmail;

    private String guestPhone;
}
