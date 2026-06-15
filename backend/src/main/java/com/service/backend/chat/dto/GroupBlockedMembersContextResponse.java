package com.service.backend.chat.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GroupBlockedMembersContextResponse {

    private List<BlockedMemberInGroupItemResponse> blockedMembers;
    private String currentUserRole;
}
