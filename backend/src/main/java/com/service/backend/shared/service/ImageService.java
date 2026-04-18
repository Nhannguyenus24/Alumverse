package com.service.backend.shared.service;

import com.sksamuel.scrimage.ImmutableImage;
import com.sksamuel.scrimage.webp.WebpWriter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.Base64;
import java.util.UUID;


@Service
public class ImageService {

    /**
     * Fixed path on the server to save images.
     * Must match the "alias" configuration in Nginx location /images/
     */
    @Value("${image.upload.dir:/var/www/backend/images/}")
    private String uploadDir;

    /**
     * Domain or base URL for accessing images from browser.
     * Example: https://yourdomain.com/images/ or http://localhost:8080/images/
     */
    @Value("${image.domain:http://localhost/images/}")
    private String domain;

    /**
     * Upload a Base64 image and convert to WebP format.
     *
     * @param base64String Base64 string of the image (may include header data:image/png;base64,...)
     * @return Full URL of the uploaded image (e.g.: https://yourdomain.com/images/uuid.webp)
     * @throws Exception if decoding, converting, or saving the file fails
     */
    public String uploadBase64Image(String base64String) throws Exception {
        try {
            // 1. Extract the Base64 header part if present (e.g.: data:image/png;base64,...)
            String pureBase64 = extractPureBase64(base64String);

            // 2. Decode Base64 string to byte array
            byte[] imageBytes = Base64.getDecoder().decode(pureBase64);

            // 3. Generate unique filename using UUID to prevent overwriting
            String fileName = UUID.randomUUID().toString() + ".webp";
            var targetPath = Paths.get(uploadDir + fileName);
            Files.createDirectories(targetPath.getParent());

            // 4. Use Scrimage to:
            //    - Load byte array as image object
            //    - Convert to WebP format (auto compressed)
            //    - Save file to disk
            ImmutableImage.loader()
                    .fromBytes(imageBytes)
                    .output(WebpWriter.DEFAULT, targetPath);

            String imageUrl = domain + fileName;
            return imageUrl;

        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid Base64 string", e);
        } catch (Exception e) {
            throw new Exception("Error processing image: " + e.getMessage(), e);
        }
    }

    /**
     * Extract pure Base64 from string that may include header.
     * <p>
     * Example:
     * - Input: data:image/png;base64,iVBORw0KGgo...
     * - Output: iVBORw0KGgo...
     *
     * @param base64String Base64 string to process
     * @return Pure Base64 string (without header part)
     */
    private String extractPureBase64(String base64String) {
        if (base64String == null || base64String.isEmpty()) {
            throw new IllegalArgumentException("Base64 string cannot be empty");
        }

        if (base64String.contains(",")) {
            // If header is present (data:image/png;base64,...), get the part after the comma
            return base64String.split(",")[1];
        }

        return base64String;
    }

    /**
     * Reactive wrapper around {@link #uploadBase64Image(String)}. If the input is blank, emits null
     * (via {@link Mono#justOrEmpty}) so callers can fall back to an existing URL. File I/O runs on
     * the bounded elastic scheduler to avoid blocking the event loop.
     */
    public Mono<String> uploadBase64IfPresent(String base64String) {
        if (base64String == null || base64String.isBlank()) {
            return Mono.empty();
        }
        return Mono.fromCallable(() -> uploadBase64Image(base64String))
                .subscribeOn(Schedulers.boundedElastic());
    }

    /**
     * Check if the image file already exists on the server.
     *
     * @param fileName name of the file to check (including extension)
     * @return true if the file exists, false otherwise
     */
    public boolean imageExists(String fileName) {
        try {
            var filePath = Paths.get(uploadDir + fileName);
            return Files.exists(filePath);
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Delete an image file from the server.
     * (Consider carefully before deleting to avoid data loss)
     *
     * @param fileName name of the file to delete (including extension)
     * @return true if deletion was successful, false otherwise
     */
    public boolean deleteImage(String fileName) {
        try {
            var filePath = Paths.get(uploadDir + fileName);
            if (Files.exists(filePath)) {
                Files.delete(filePath);
                return true;
            }
            return false;
        } catch (Exception e) {
            return false;
        }
    }
}
