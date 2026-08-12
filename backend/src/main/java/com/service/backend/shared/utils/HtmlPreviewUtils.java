package com.service.backend.shared.utils;

import org.jsoup.Jsoup;

/** Shared HTML-to-text conversion for bounded list/card previews. */
public final class HtmlPreviewUtils {

    private HtmlPreviewUtils() {
    }

    public static String toPlainText(String html) {
        return Jsoup.parse(html == null ? "" : html).text();
    }

    public static String toPlainTextPreview(String html, int maxLength) {
        String plainText = toPlainText(html);
        if (maxLength < 0 || plainText.length() <= maxLength) {
            return plainText;
        }

        int endIndex = maxLength;
        if (endIndex > 0 && Character.isHighSurrogate(plainText.charAt(endIndex - 1))) {
            endIndex--;
        }
        return plainText.substring(0, endIndex);
    }
}
