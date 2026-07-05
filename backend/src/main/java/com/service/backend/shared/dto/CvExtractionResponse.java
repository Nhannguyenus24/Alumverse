package com.service.backend.shared.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Structured result of AI CV parsing: fields auto-filled into the mentor
 * signup form's "profile" step. Mirrors the shape the web/mobile forms
 * already use for extendedProfile (educations/experiences/projects/awards/skills).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CvExtractionResponse {
    private String currentJobTitle;
    private String currentCompany;
    private String bio;
    private List<CvEducationEntry> educations;
    private List<CvExperienceEntry> experiences;
    private List<CvProjectEntry> projects;
    private List<CvAwardEntry> awards;
    private List<CvSkillEntry> skills;
}
