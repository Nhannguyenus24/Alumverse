package com.service.backend.article.presentation.dto.response;

import com.service.backend.article.domain.entity.SavedItem;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SavedItemResponse {

    private Integer id;
    private Integer memberId;
    private String itemType;
    private Integer itemId;
    private String note;
    private LocalDateTime savedAt;

    public static SavedItemResponse from(SavedItem savedItem) {
        return SavedItemResponse.builder()
                .id(savedItem.getId())
                .memberId(savedItem.getMemberId())
                .itemType(savedItem.getItemType())
                .itemId(savedItem.getItemId())
                .note(savedItem.getNote())
                .savedAt(savedItem.getSavedAt())
                .build();
    }
}
