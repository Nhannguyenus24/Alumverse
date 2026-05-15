package com.service.backend.shared.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.Base64;
import java.util.Set;
import java.util.UUID;

@Slf4j
@Service
public class FileUploadService {

    @Value("${image.upload.dir:/var/www/backend/images/}")
    private String uploadDir;

    @Value("${image.domain:http://localhost/images/}")
    private String domain;

    private static final long MAX_BYTES = 10L * 1024 * 1024;
    private static final Set<String> ALLOWED_EXTENSIONS = Set.of("pdf", "doc", "docx");

    public Mono<String> uploadBase64File(String base64String, String originalFileName) {
        return Mono.fromCallable(() -> doUpload(base64String, originalFileName))
                .subscribeOn(Schedulers.boundedElastic());
    }

    private String doUpload(String base64String, String originalFileName) throws Exception {
        if (base64String == null || base64String.isBlank()) {
            throw new IllegalArgumentException("Base64 string cannot be empty");
        }

        String extension = resolveExtension(originalFileName);
        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new IllegalArgumentException(
                    "Unsupported file type: ." + extension + ". Allowed: pdf, doc, docx");
        }

        String pure = base64String.contains(",") ? base64String.split(",", 2)[1] : base64String;
        byte[] bytes = Base64.getDecoder().decode(pure);

        if (bytes.length > MAX_BYTES) {
            throw new IllegalArgumentException("File exceeds 10MB limit");
        }

        String fileName = UUID.randomUUID() + "." + extension;
        var targetPath = Paths.get(uploadDir + fileName);
        Files.createDirectories(targetPath.getParent());
        Files.write(targetPath, bytes);

        return domain + fileName;
    }

    private String resolveExtension(String fileName) {
        if (fileName == null) return "";
        int dot = fileName.lastIndexOf('.');
        if (dot < 0 || dot == fileName.length() - 1) return "";
        return fileName.substring(dot + 1).toLowerCase();
    }
}
