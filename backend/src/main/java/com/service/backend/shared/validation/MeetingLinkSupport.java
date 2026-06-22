package com.service.backend.shared.validation;

import java.net.URI;
import java.util.List;
import java.util.Locale;

/**
 * Shared support for validating online meeting links (ME-01).
 *
 * <p>Only links from a whitelist of well-known conferencing providers are
 * accepted for mentorship sessions. This protects mentees from being sent to
 * arbitrary / unsafe URLs and keeps the "join" experience predictable.</p>
 *
 * <p>The whitelist matches a host either exactly or as a sub-domain of an
 * allowed domain (e.g. {@code us05web.zoom.us} matches {@code zoom.us}).</p>
 */
public final class MeetingLinkSupport {

    private MeetingLinkSupport() {
    }

    /** Allowed base domains for meeting links. */
    public static final List<String> ALLOWED_DOMAINS = List.of(
            "meet.google.com",
            "zoom.us",
            "zoom.com",
            "teams.microsoft.com",
            "teams.live.com",
            "teams.microsoft.us",
            "meet.jit.si",
            "whereby.com",
            "webex.com",
            "gotomeeting.com"
    );

    /** Human-readable list of accepted platforms, for error / help messages. */
    public static final String ALLOWED_PLATFORMS_LABEL =
            "Google Meet, Zoom, Microsoft Teams, Jitsi Meet, Whereby, Webex, GoToMeeting";

    /**
     * @return {@code true} if the link points to a whitelisted conferencing
     * provider. Blank input returns {@code false} (callers decide whether blank
     * is allowed).
     */
    public static boolean isAllowed(String rawUrl) {
        String host = extractHost(rawUrl);
        if (host == null) {
            return false;
        }
        for (String domain : ALLOWED_DOMAINS) {
            if (host.equals(domain) || host.endsWith("." + domain)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Extracts a lower-cased host from a URL that may or may not include a
     * scheme. Returns {@code null} when the value is blank or unparseable.
     */
    public static String extractHost(String rawUrl) {
        if (rawUrl == null) {
            return null;
        }
        String value = rawUrl.trim();
        if (value.isEmpty()) {
            return null;
        }
        if (!value.matches("(?i)^[a-z][a-z0-9+.-]*://.*")) {
            value = "https://" + value;
        }
        try {
            String host = URI.create(value).getHost();
            return host == null ? null : host.toLowerCase(Locale.ROOT);
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }
}
