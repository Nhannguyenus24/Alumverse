package com.service.backend.admin.dto.config;

import java.util.List;
import java.util.Map;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FeatureConfig {

    @JsonProperty("site_identity")
    private SiteIdentity siteIdentity;

    @JsonProperty("brand_config")
    private BrandConfig brandConfig;

    @JsonProperty("features_config")
    private Map<String, Feature> featuresConfig;

    @JsonProperty("privacy_settings")
    private PrivacySettings privacySettings;

    // ── site_identity ──────────────────────────────────────────────────────────

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class SiteIdentity {
        @JsonProperty("site_title")
        private String siteTitle;
        private String slug;
        private Introduction introduction;
    }

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class Introduction {
        private String tagline;
        private String description;
    }

    // ── brand_config ───────────────────────────────────────────────────────────

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class BrandConfig {
        @JsonProperty("logo_url")
        private String logoUrl;
        @JsonProperty("favicon_url")
        private String faviconUrl;
        @JsonProperty("hero_banner_url")
        private String heroBannerUrl;
        @JsonProperty("hero_slides")
        private List<String> heroSlides;
        @JsonProperty("theme_colors")
        private ThemeColors themeColors;
    }

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class ThemeColors {
        private String primary;
        private String secondary;
        private String accent;
    }

    // ── features_config ────────────────────────────────────────────────────────

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class Feature {
        private Boolean enabled;
        private Map<String, Object> settings;
    }

    // ── privacy_settings ───────────────────────────────────────────────────────

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class PrivacySettings {
        @JsonProperty("visibility_mode")
        private String visibilityMode;
        @JsonProperty("homepage_layout")
        private List<String> homepageLayout;
    }
}
