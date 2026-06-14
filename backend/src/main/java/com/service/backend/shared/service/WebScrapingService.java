package com.service.backend.shared.service;

import lombok.extern.slf4j.Slf4j;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * Service responsible for scraping and extracting text data from websites.
 */
@Slf4j
@Service
public class WebScrapingService {

    /**
     * Connects to a given URL and extracts all the readable text, stripping away HTML tags, 
     * styles, and scripts.
     *
     * @param url The URL of the website to scrape.
     * @return The extracted readable text.
     * @throws IllegalArgumentException if the URL is invalid or null.
     * @throws RuntimeException         if there is a network error or the site cannot be reached.
     */
    public String scrapeDataFromUrl(String url) {
        if (url == null || url.trim().isEmpty()) {
            throw new IllegalArgumentException("URL cannot be null or empty.");
        }

        try {
            log.info("Connecting to URL: {}", url);
            
            // Connect to the URL and parse the HTML document.
            // We set a reasonable timeout (e.g., 10 seconds) to avoid hanging indefinitely.
            Document doc = Jsoup.connect(url)
                    .timeout(10000)
                    .userAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64)") // Pretend to be a browser
                    .get();

            // Extract the readable text from the document.
            // This automatically ignores <script>, <style>, and other non-visible tags.
            String text = doc.text();
            
            log.info("Successfully scraped {} characters from URL.", text.length());
            return text;

        } catch (IOException e) {
            log.error("Failed to scrape data from URL: {}", url, e);
            throw new RuntimeException("Error scraping data from URL: " + e.getMessage(), e);
        } catch (IllegalArgumentException e) {
            log.error("Invalid URL provided: {}", url, e);
            throw new IllegalArgumentException("Invalid URL: " + e.getMessage(), e);
        }
    }
}
