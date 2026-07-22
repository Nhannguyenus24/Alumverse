package com.service.backend.shared.util;

import org.jsoup.Jsoup;
import org.jsoup.safety.Safelist;

/**
 * Utility for sanitizing user input to prevent XSS and other injection attacks.
 */
public class InputSanitizer {

    // Whitelist safe HTML tags
    private static final Safelist SAFE_WHITELIST = Safelist.basic()
        .addAttributes("a", "href", "title")
        .addAttributes("img", "src", "alt")
        .removeTags("script", "iframe", "object", "embed", "form", "button")
        .removeAttributes("a", "onclick", "onerror");

    /**
     * Sanitize HTML content - Remove dangerous tags while keeping safe formatting
     */
    public static String sanitizeHtml(String dirtyHtml) {
        if (dirtyHtml == null || dirtyHtml.isBlank()) {
            return "";
        }
        return Jsoup.clean(dirtyHtml, SAFE_WHITELIST);
    }

    /**
     * Escape HTML entities - Prevent XSS attacks
     * Converts: < > " ' & to their HTML entity equivalents
     */
    public static String escapeHtml(String text) {
        if (text == null) {
            return "";
        }
        return text
            .replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;")
            .replace("\"", "&quot;")
            .replace("'", "&#39;");
    }

    /**
     * Remove potentially dangerous SQL patterns (defense in depth)
     * Note: This is NOT a replacement for parameterized queries!
     * Use parameterized queries as primary defense.
     */
    public static String sanitizeSqlInput(String input) {
        if (input == null) {
            return "";
        }
        // Only allow alphanumeric, spaces, hyphens, underscores
        return input.replaceAll("[^a-zA-Z0-9\\s\\-_]", "");
    }

    /**
     * Validate URL to prevent SSRF attacks
     */
    public static boolean isValidUrl(String url) {
        if (url == null || url.isBlank()) {
            return false;
        }
        try {
            new java.net.URL(url).toURI();
            // Only allow HTTP and HTTPS
            return url.startsWith("https://") || url.startsWith("http://");
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Sanitize file upload filename to prevent path traversal
     */
    public static String sanitizeFilename(String filename) {
        if (filename == null || filename.isBlank()) {
            return "file";
        }
        // Remove path separators and special characters
        return filename
            .replace("/", "")
            .replace("\\", "")
            .replace("..", "")
            .replaceAll("[^a-zA-Z0-9\\._-]", "_");
    }

    /**
     * Remove whitespace and normalize strings
     */
    public static String normalizeString(String input) {
        if (input == null) {
            return "";
        }
        return input.trim().replaceAll("\\s+", " ");
    }
}
