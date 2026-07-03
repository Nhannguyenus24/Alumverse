package com.service.backend.shared.bean;

import com.fasterxml.jackson.core.exc.StreamConstraintsException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.http.converter.json.Jackson2ObjectMapperBuilder;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Regression test for a real production failure: uploading a ~21MB chat video
 * (Base64 ~28M chars) was rejected with a 400 even though
 * {@code FileUploadService}'s own 30MB limit allows it, because Jackson's
 * default {@code StreamReadConstraints.maxStringLength} (20_000_000 chars) is
 * enforced during JSON body decoding, before any application code runs.
 */
class JacksonConfigTest {

    private static String jsonWithStringOfLength(int length) {
        return "{\"base64String\":\"" + "a".repeat(length) + "\"}";
    }

    @Test
    void defaultObjectMapperRejectsStringsOver20MillionChars() {
        ObjectMapper mapper = Jackson2ObjectMapperBuilder.json().build();
        String json = jsonWithStringOfLength(21_000_000);

        assertThatThrownBy(() -> mapper.readTree(json))
                .isInstanceOf(StreamConstraintsException.class);
    }

    @Test
    void customizedObjectMapperAcceptsChatAttachmentSizedPayload() throws Exception {
        Jackson2ObjectMapperBuilder builder = Jackson2ObjectMapperBuilder.json();
        new JacksonConfig().jsonMaxStringLengthCustomizer().customize(builder);
        ObjectMapper mapper = builder.build();

        // ~30MB raw video -> ~40M char Base64 string; must decode without error.
        String json = jsonWithStringOfLength(40_000_000);

        assertThat(mapper.readTree(json).get("base64String").asText()).hasSize(40_000_000);
    }
}
