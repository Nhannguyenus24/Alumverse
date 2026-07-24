package com.service.backend.shared.service;

import com.sksamuel.scrimage.ImmutableImage;
import com.sksamuel.scrimage.webp.WebpWriter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.nio.file.Files;
import java.nio.file.Paths;
import java.nio.file.Path;
import java.util.Base64;
import java.util.UUID;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import io.micrometer.core.instrument.Gauge;
import jakarta.annotation.PostConstruct;


@Service
public class ImageService {

    private static final Logger log = LoggerFactory.getLogger(ImageService.class);

    /**
     * Fixed path on the server to save images.
     * Must match the "alias" configuration in Nginx location /images/
     */
    @Value("${image.upload.dir:/var/www/backend/images/}")
    private String uploadDir;

    /**
     * Domain or base URL for accessing images from browser.
     * Example: https://yourdomain.com/images/ or <a href="http://localhost:8080/images/">...</a>
     */
    @Value("${image.domain:http://localhost/images/}")
    private String domain;

    private final MeterRegistry meterRegistry;

    private static final long IMAGE_MAX_BYTES = 10L * 1024 * 1024;

    public ImageService(MeterRegistry meterRegistry) {
        this.meterRegistry = meterRegistry;
    }

    @PostConstruct
    public void initMetrics() {
        Gauge.builder("image.storage.size.bytes", this, ImageService::getImagesDirectorySize)
             .description("Current total size of images stored by the backend")
             .register(meterRegistry);
    }

    private double getImagesDirectorySize() {
        try {
            Path folder = Paths.get(uploadDir);
            if (!Files.exists(folder)) return 0;
            try (java.util.stream.Stream<Path> pathStream = Files.walk(folder)) {
                return pathStream
                        .filter(p -> p.toFile().isFile())
                        .mapToLong(p -> p.toFile().length())
                        .sum();
            }
        } catch (Exception e) {
            return 0;
        }
    }

    /**
     * Upload a Base64 image and convert to WebP format.
     *
     * @param base64String Base64 string of the image (may include header data:image/png;base64,...)
     * @return Full URL of the uploaded image (e.g.: https://yourdomain.com/images/uuid.webp)
     * @throws Exception if decoding, converting, or saving the file fails
     */
    public String uploadBase64Image(String base64String) throws Exception {
        // 1. Extract the Base64 header part if present (e.g.: data:image/png;base64,...)
        String pureBase64 = extractPureBase64(base64String);

        // 2. Decode Base64 string to byte array (cheap; done synchronously so bad input is
        //    rejected before we hand back a URL).
        byte[] imageBytes;
        try {
            imageBytes = Base64.getDecoder().decode(pureBase64);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid Base64 string", e);
        }

        // 3. Reject oversized payloads before the expensive decode/encode below.
        if (imageBytes.length > IMAGE_MAX_BYTES) {
            throw new IllegalArgumentException(
                    "Image exceeds " + (IMAGE_MAX_BYTES / (1024 * 1024)) + "MB limit");
        }

        // 4. Generate unique filename using UUID to prevent overwriting.
        String fileName = UUID.randomUUID() + ".webp";
        Path targetPath = Paths.get(uploadDir + fileName);

        // 5. Fire-and-forget: the filename (hence the URL) is deterministic, so we return it
        //    immediately and run the expensive WebP encode + disk write on a background thread
        //    detached from this request. Trade-off: if encoding later fails the URL will 404.
        encodeAndStoreAsync(imageBytes, targetPath);

        return domain + fileName;
    }

    /**
     * Runs the blocking decode/WebP-encode/disk-write on the bounded elastic scheduler, fully
     * detached from any caller (fire-and-forget). Nothing awaits the result, so failures are
     * logged rather than propagated.
     */
    private void encodeAndStoreAsync(byte[] imageBytes, Path targetPath) {
        Mono.fromRunnable(() -> {
                    Timer.Sample sample = Timer.start(meterRegistry);
                    try {
                        Files.createDirectories(targetPath.getParent());
                        ImmutableImage.loader()
                                .fromBytes(imageBytes)
                                .output(WebpWriter.DEFAULT, targetPath);
                        sample.stop(meterRegistry.timer("image.processing.time"));
                    } catch (Exception e) {
                        log.error("Background WebP encode failed for {}: {}",
                                targetPath, e.getMessage(), e);
                    }
                })
                .subscribeOn(Schedulers.boundedElastic())
                .subscribe();
    }

    /**
     * Reactive wrapper around {@link #uploadBase64Image(String)}; offloads the blocking
     * decode/resize/encode work to the bounded elastic scheduler instead of the WebFlux
     * event-loop thread.
     */
    public Mono<String> uploadBase64ImageReactive(String base64String) {
        return Mono.fromCallable(() -> uploadBase64Image(base64String))
                .subscribeOn(Schedulers.boundedElastic());
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
    private boolean isAlreadyUrl(String value) {
        if (value == null || value.isBlank()) return true;
        if (value.startsWith("data:image/")) return false;
        if (value.startsWith("http://") || value.startsWith("https://") || value.startsWith("/") || value.startsWith("blob:")) {
            return true;
        }
        if (value.contains(".") || value.contains("/") || value.length() < 100) {
            return true;
        }
        return false;
    }

    public Mono<String> uploadBase64IfPresent(String base64String) {
        if (base64String == null || base64String.isBlank()) {
            return Mono.empty();
        }
        if (isAlreadyUrl(base64String)) {
            return Mono.just(base64String);
        }
        return Mono.fromCallable(() -> uploadBase64Image(base64String))
                .onErrorResume(e -> Mono.just(base64String))
                .subscribeOn(Schedulers.boundedElastic());
    }

    public Mono<Boolean> deleteImage(String fileName) {
        return Mono.fromCallable(() -> {
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
        }).subscribeOn(Schedulers.boundedElastic());
    }
}
