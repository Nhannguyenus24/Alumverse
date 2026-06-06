package com.service.backend.event.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Data
public class InviteUsersRequest {

    @NotEmpty(message = "Danh sách người được mời không được trống")
    private List<InviteeItem> invitees;

    @Data
    public static class InviteeItem {
        private Long memberId;
        private String email;
    }
}
