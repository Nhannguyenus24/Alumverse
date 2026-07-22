
package com.service.backend.event.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RegisterTicketRequest {

    @Size(max = 255)
    @Schema(example = "Nguyen Van A")
    @Size(max = 255)

    private String guestName;

    @Email()
    @Size(max = 255)
    @Schema(example = "nguyenvana@gmail.com")
    @Size(max = 255)

    private String guestEmail;

    @Size(max = 20)
    @Schema(example = "0912345678")
    @Size(max = 255)

    private String guestPhone;

    @Valid
    @Schema(description = "Registration form answers")
    @Size(max = 100)

    private List<AnswerItem> answers;
}
