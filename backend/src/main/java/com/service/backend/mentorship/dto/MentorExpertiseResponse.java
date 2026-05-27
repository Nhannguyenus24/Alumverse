package com.service.backend.mentorship.dto;

import com.service.backend.mentorship.entity.MentorExpertise;
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
    private String category;
    private String tag;

    public static MentorExpertiseResponse from(MentorExpertise expertise) {
        return MentorExpertiseResponse.builder()
                .id(expertise.getId())
                .mentorMemberId(expertise.getMentorMemberId())
                .topic(expertise.getTopic())
                .yearsExperience(expertise.getYearsExperience())
                .description(expertise.getDescription())
                .category(expertise.getCategory())
                .tag(expertise.getTag())
                .build();
    }
}
