package com.service.backend.event.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

@Data
public class InviteUsersRequest {

    @NotEmpty(message = "Danh sách người được mời không được trống")
    @Size(max = 100)

    private List<InviteeItem> invitees;

    @Data
    public static class InviteeItem {
        private Long memberId;
        @Size(max = 255)

        private String email;
    }
}
