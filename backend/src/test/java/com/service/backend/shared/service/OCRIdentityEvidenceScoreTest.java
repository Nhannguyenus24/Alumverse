package com.service.backend.shared.service;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class OCRIdentityEvidenceScoreTest {

    @Test
    void prefersStructuredIdentityText() {
        int weak = OCRService.identityEvidenceScore("TRUONG DAI HOC KHOA HOC TU NHIEN");
        int strong = OCRService.identityEvidenceScore("Ho ten: Nguyen Van An\nMSSV: 22123456");

        assertThat(strong).isGreaterThanOrEqualTo(5);
        assertThat(strong).isGreaterThan(weak);
    }
}
