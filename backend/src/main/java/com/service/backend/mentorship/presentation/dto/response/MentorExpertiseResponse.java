package com.service.backend.mentorship.presentation.dto.response;

import com.service.backend.mentorship.domain.entity.MentorExpertise;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MentorExpertiseResponse {

    private Integer id;
    private Integer mentorMemberId;
    private String topic;
    private Integer yearsExperience;
    private String description;

    public static MentorExpertiseResponse from(MentorExpertise expertise) {
        return MentorExpertiseResponse.builder()
                .id(expertise.getId())
                .mentorMemberId(expertise.getMentorMemberId())
                .topic(expertise.getTopic())
                .yearsExperience(expertise.getYearsExperience())
                .description(expertise.getDescription())
                .build();
    }
}
