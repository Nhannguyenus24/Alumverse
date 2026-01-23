package com.service.backend.eventmodule.presentation.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RegisterTicketRequest {

    @Size(max = 255)
    private String guestName;

    @Email()
    @Size(max = 255)
    private String guestEmail;

    @Size(max = 20)
    private String guestPhone;
}
