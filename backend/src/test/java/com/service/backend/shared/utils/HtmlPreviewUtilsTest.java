package com.service.backend.shared.utils;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class HtmlPreviewUtilsTest {

    @Test
    void parsesEntitiesAndHtmlIntoBoundedPlainText() {
        String html = "<p>AT&amp;T&nbsp;event</p><div>Second line</div>";

        assertThat(HtmlPreviewUtils.toPlainTextPreview(html, 15))
                .isEqualTo("AT&T event Seco")
                .doesNotContain("<", "&amp;", "&nbsp;");
    }

    @Test
    void doesNotSplitSurrogatePairsAtTheLimit() {
        assertThat(HtmlPreviewUtils.toPlainTextPreview("a".repeat(9) + "😀suffix", 10))
                .isEqualTo("a".repeat(9));
    }
}
