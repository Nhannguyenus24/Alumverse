package com.service.backend.article.validation;

import com.service.backend.shared.enums.ErrorCode;
import com.service.backend.shared.exception.ApplicationException;

import java.util.Map;
import java.util.Set;

public final class ArticleTopicCatalog {

    public enum Channel {
        NEWS,
        ALUMNI,
        ACHIEVEMENT,
        JOB,
        LEARNING,
        EVENT
    }

    private static final Map<Channel, Set<String>> TOPICS_BY_CHANNEL = Map.of(
            Channel.NEWS, Set.of(
                    "school_announcement",
                    "faculty_department",
                    "student_activities",
                    "faculty_activities",
                    "school_activities",
                    "ceremony_news",
                    "alumni_news",
                    "enterprise_cooperation",
                    "academic_research",
                    "admission_scholarship",
                    "donation"
            ),
            Channel.ALUMNI, Set.of(
                    "alumni_profile",
                    "entrepreneur",
                    "startup",
                    "arts_creativity",
                    "global_life",
                    "travel_lifestyle",
                    "community_giving",
                    "alumni_reunion",
                    "academic_research_alumni",
                    "faculty_honor",
                    "study_abroad"
            ),
            Channel.ACHIEVEMENT, Set.of(
                    "faculty_honor",
                    "research",
                    "research_publication",
                    "competition_award",
                    "prestigious_scholarship",
                    "career_milestone",
                    "startup_investment",
                    "international_honor",
                    "social_contribution_award"
            ),
            Channel.JOB, Set.of(
                    "internship",
                    "management_trainee",
                    "full_time",
                    "part_time",
                    "freelance",
                    "internal_referral",
                    "remote",
                    "lab_opportunity",
                    "practical_experience"
            ),
            Channel.LEARNING, Set.of(
                    "scholarships",
                    "bachelor",
                    "masters_doctorate",
                    "study_abroad",
                    "student_exchange",
                    "special_session",
                    "online_course",
                    "certificate",
                    "research"
            ),
            Channel.EVENT, Set.of(
                    "workshop",
                    "talkshow",
                    "conference",
                    "academic_seminar",
                    "fair_exhibition",
                    "reunion",
                    "ceremony",
                    "competition_event",
                    "concert_art",
                    "club_activities"
            )
    );

    private ArticleTopicCatalog() {
    }

    public static String requireValid(Channel channel, String value) {
        String normalized = normalize(value);
        if (normalized == null || !TOPICS_BY_CHANNEL.getOrDefault(channel, Set.of()).contains(normalized)) {
            throw new ApplicationException(
                    ErrorCode.BAD_REQUEST,
                    "Invalid topic for channel " + channel.name().toLowerCase() + ": " + value
            );
        }
        return normalized;
    }

    public static String normalize(String value) {
        if (value == null || value.trim().isEmpty()) {
            return null;
        }
        return value.trim().toLowerCase().replace("-", "_");
    }
}
