package com.service.backend.forum.dto;

import java.util.List;

import com.service.backend.shared.dto.PageInfo;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ForumTopicPageResponse {
    private List<ForumTopicDTO> items;
    private PageInfo pageInfo;
}
