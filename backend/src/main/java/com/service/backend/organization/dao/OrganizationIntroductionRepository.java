package com.service.backend.organization.dao;

import org.springframework.data.r2dbc.repository.Modifying;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.service.backend.shared.entity.OrganizationIntroduction;

import reactor.core.publisher.Mono;

@Repository
public interface OrganizationIntroductionRepository extends R2dbcRepository<OrganizationIntroduction, Integer> {

    Mono<OrganizationIntroduction> findByOrgaId(Integer orgaId);

    @Modifying
    @Query("UPDATE organization_introductions SET content = :content, " +
           "vision = :vision, mission = :mission, core_values = :coreValues, " +
           "banner_url = :bannerUrl, image_urls = CAST(:imageUrls AS json), " +
           "leaders = CAST(:leaders AS json), team_members = CAST(:teamMembers AS json), " +
           "leaders_content = :leadersContent, team_members_content = :teamMembersContent WHERE orga_id = :orgaId")
    Mono<Integer> updateFields(
            @Param("orgaId") Integer orgaId,
            @Param("content") String content,
            @Param("vision") String vision,
            @Param("mission") String mission,
            @Param("coreValues") String coreValues,
            @Param("bannerUrl") String bannerUrl,
            @Param("imageUrls") String imageUrls,
            @Param("leaders") String leaders,
            @Param("teamMembers") String teamMembers,
            @Param("leadersContent") String leadersContent,
            @Param("teamMembersContent") String teamMembersContent
    );
}
