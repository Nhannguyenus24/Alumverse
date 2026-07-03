package com.service.backend.shared.bean;

import com.fasterxml.jackson.core.JsonFactory;
import com.fasterxml.jackson.core.StreamReadConstraints;
import org.springframework.boot.autoconfigure.jackson.Jackson2ObjectMapperBuilderCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class JacksonConfig {

    /**
     * Jackson's default {@code StreamReadConstraints.maxStringLength} is 20_000_000
     * chars, independent of {@code spring.codec.max-in-memory-size}. A single JSON
     * string field (the Base64 payload of a chat video/image upload) can exceed
     * that once the file approaches ~15MB raw (~20MB Base64), so it must be raised
     * to match the upload limits in {@link com.service.backend.shared.service.FileUploadService}.
     */
    @Bean
    public Jackson2ObjectMapperBuilderCustomizer jsonMaxStringLengthCustomizer() {
        return builder -> builder.factory(JsonFactory.builder()
                .streamReadConstraints(StreamReadConstraints.builder()
                        .maxStringLength(50_000_000)
                        .build())
                .build());
    }
}
