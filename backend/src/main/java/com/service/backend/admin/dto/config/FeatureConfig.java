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
    private OrganizationFeatures featuresConfig;

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
    public static class OrganizationFeatures {
        private Feature mentorship;
        private Feature job;
        private Feature fund;
        private Feature events;
        private Feature forum;

        public Feature getFeature(String name) {
            return switch (name.toLowerCase()) {
                case "mentorship" -> mentorship;
                case "job" -> job;
                case "fund" -> fund;
                case "events" -> events;
                case "forum" -> forum;
                default -> null;
            };
        }

        public void setFeature(String name, Feature feature) {
            switch (name.toLowerCase()) {
                case "mentorship" -> mentorship = feature;
                case "job" -> job = feature;
                case "fund" -> fund = feature;
                case "events" -> events = feature;
                case "forum" -> forum = feature;
            }
        }
    }

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class Feature {
        private Boolean enabled;
        private Map<String, Object> settings;

        @com.fasterxml.jackson.annotation.JsonCreator
        public static Feature fromValue(Object value) {
            if (value instanceof Boolean b) {
                return Feature.builder().enabled(b).build();
            }
            if (value instanceof Map map) {
                Boolean enabled = (Boolean) map.get("enabled");
                Map<String, Object> settings = (Map<String, Object>) map.get("settings");
                return Feature.builder().enabled(enabled).settings(settings).build();
            }
            return null;
        }
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
