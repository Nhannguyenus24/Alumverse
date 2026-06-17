package com.service.backend.shared.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.core.type.TypeReference;
import com.service.backend.shared.enums.QuestionType;
import com.service.backend.shared.utils.JsonUtils;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table("event_questions")
public class EventQuestion {

    @Id
    private Integer id;

    @Column("event_id")
    private Long eventId;

    private QuestionType type;

    private String label;

    @JsonIgnore
    @Column("options")
    private String optionsJson;

    private Boolean required;

    @Column("order_index")
    private Integer orderIndex;

    @CreatedDate
    @Column("created_at")
    private LocalDateTime createdAt;

    @JsonProperty("options")
    public List<String> getOptions() {
        if (optionsJson == null || optionsJson.isBlank()) return null;
        return JsonUtils.fromJson(optionsJson, new TypeReference<List<String>>() {});
    }

    public void setOptions(List<String> options) {
        this.optionsJson = options == null ? null : JsonUtils.toJson(options);
    }
}
