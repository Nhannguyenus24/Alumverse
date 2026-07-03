package com.service.backend.shared.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.Base64;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;

@Slf4j
@Service
public class FileUploadService {

    @Value("${image.upload.dir:/var/www/backend/images/}")
    private String uploadDir;

    @Value("${image.domain:http://localhost/images/}")
    private String domain;

    private final MeterRegistry meterRegistry;

    public FileUploadService(MeterRegistry meterRegistry) {
        this.meterRegistry = meterRegistry;
    }

    private static final long DOC_MAX_BYTES = 10L * 1024 * 1024;
    private static final long IMAGE_MAX_BYTES = 10L * 1024 * 1024;
    private static final long VIDEO_MAX_BYTES = 30L * 1024 * 1024;

    private static final Set<String> DOC_EXTENSIONS = Set.of("pdf", "doc", "docx");
    private static final Set<String> IMAGE_EXTENSIONS = Set.of("png", "jpg", "jpeg", "webp", "gif");
    private static final Set<String> VIDEO_EXTENSIONS = Set.of("mp4", "mov", "webm", "m4v");
    private static final Set<String> ALLOWED_EXTENSIONS = Set.of(
            "pdf", "doc", "docx", "png", "jpg", "jpeg", "webp", "gif", "mp4", "mov", "webm", "m4v");

    private static final Map<String, Long> MAX_BYTES_BY_EXTENSION = buildMaxBytesByExtension();

    private static Map<String, Long> buildMaxBytesByExtension() {
        Map<String, Long> map = new java.util.HashMap<>();
        DOC_EXTENSIONS.forEach(ext -> map.put(ext, DOC_MAX_BYTES));
        IMAGE_EXTENSIONS.forEach(ext -> map.put(ext, IMAGE_MAX_BYTES));
        VIDEO_EXTENSIONS.forEach(ext -> map.put(ext, VIDEO_MAX_BYTES));
        return Map.copyOf(map);
    }

    public Mono<String> uploadBase64File(String base64String, String originalFileName) {
        return Mono.fromCallable(() -> doUpload(base64String, originalFileName))
                .subscribeOn(Schedulers.boundedElastic());
    }

    public String getLocalPath(String fileUrl) {
        if (fileUrl == null || !fileUrl.startsWith(domain)) {
            return null;
        }
        String fileName = fileUrl.substring(domain.length());
        return uploadDir + fileName;
    }

    private String doUpload(String base64String, String originalFileName) throws Exception {
        Timer.Sample sample = Timer.start(meterRegistry);
        try {
            if (base64String == null || base64String.isBlank()) {
                throw new IllegalArgumentException("Base64 string cannot be empty");
            }

            String extension = resolveExtension(originalFileName);
            if (!ALLOWED_EXTENSIONS.contains(extension)) {
                throw new IllegalArgumentException(
                        "Unsupported file type: ." + extension + ". Allowed: "
                                + String.join(", ", ALLOWED_EXTENSIONS));
            }

            String pure = base64String.contains(",") ? base64String.split(",", 2)[1] : base64String;
            byte[] bytes = Base64.getDecoder().decode(pure);

            long maxBytes = MAX_BYTES_BY_EXTENSION.get(extension);
            if (bytes.length > maxBytes) {
                throw new IllegalArgumentException(
                        "File exceeds " + (maxBytes / (1024 * 1024)) + "MB limit for ." + extension + " files");
            }

            String fileName = UUID.randomUUID() + "." + extension;
            var targetPath = Paths.get(uploadDir + fileName);
            Files.createDirectories(targetPath.getParent());
            Files.write(targetPath, bytes);

            return domain + fileName;
        } finally {
            sample.stop(meterRegistry.timer("file.upload.processing.time"));
        }
    }

    private String resolveExtension(String fileName) {
        if (fileName == null) return "";
        int dot = fileName.lastIndexOf('.');
        if (dot < 0 || dot == fileName.length() - 1) return "";
        return fileName.substring(dot + 1).toLowerCase();
    }
}
