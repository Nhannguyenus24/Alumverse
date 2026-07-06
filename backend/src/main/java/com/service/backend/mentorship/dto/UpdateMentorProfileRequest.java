package com.service.backend.mentorship.dto;

import com.service.backend.shared.validation.ValidMeetingLink;
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
public class UpdateMentorProfileRequest {

    @Size(max = 255)
    private String currentJobTitle;

    @Size(max = 255)
    private String currentCompany;

    @Size(max = 5000)
    private String bio;

    @Size(max = 500)
    private String avatarUrl;


    @Size(max = 500)
    @ValidMeetingLink
    private String defaultMeetingLink;

    @Size(max = 5000)
    private String bookingWindowSettings;

    @Size(max = 20000)
    private String extendedProfile;

    @Size(max = 30)
    private List<@Size(max = 100) String> expertiseTags;
}
