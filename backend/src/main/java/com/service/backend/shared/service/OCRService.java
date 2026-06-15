package com.service.backend.shared.service;

import lombok.extern.slf4j.Slf4j;
import net.sourceforge.tess4j.ITesseract;
import net.sourceforge.tess4j.Tesseract;
import net.sourceforge.tess4j.TesseractException;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import org.springframework.web.multipart.MultipartFile;
import reactor.core.publisher.Mono;

/**
 * Service responsible for Optical Character Recognition (OCR) and text extraction.
 * Supports processing of PNG, JPEG, PDF, and plain TXT files.
 */
@Slf4j
@Service
public class OCRService {

    public OCRService() {
    }

    /**
     * Extracts text content from a given file path.
     * Supported formats: PNG, JPEG, JPG, PDF, TXT.
     */
    public Mono<String> extractTextFromFile(String filePath) {
        if (filePath == null || filePath.trim().isEmpty()) {
            return Mono.error(new IllegalArgumentException("File path cannot be null or empty."));
        }

        return Mono.fromCallable(() -> {
            File file = new File(filePath);
            if (!file.exists() || !file.isFile()) {
                throw new IllegalArgumentException("File does not exist or is not a valid file: " + filePath);
            }

            String extension = getFileExtension(file.getName()).toLowerCase();

            switch (extension) {
                case "txt":
                    return readTextFile(file);
                case "png":
                case "jpeg":
                case "jpg":
                case "pdf":
                    return performOcr(file);
                default:
                    throw new IllegalArgumentException("Unsupported file format: " + extension);
            }
        }).subscribeOn(reactor.core.scheduler.Schedulers.boundedElastic())
          .onErrorMap(IOException.class, e -> {
              log.error("Failed to read text file: {}", filePath, e);
              return new RuntimeException("Error reading text file: " + e.getMessage(), e);
          })
          .onErrorMap(TesseractException.class, e -> {
              log.error("OCR processing failed for file: {}", filePath, e);
              return new RuntimeException("Error during OCR processing: " + e.getMessage(), e);
          });
    }

    /**
     * Extracts text content from a Spring MultipartFile.
     */
    public Mono<String> extractTextFromMultipartFile(MultipartFile file) {
        return Mono.fromCallable(() -> {
            Path tempFile = Files.createTempFile("ocr_", "_" + file.getOriginalFilename());
            Files.copy(file.getInputStream(), tempFile, StandardCopyOption.REPLACE_EXISTING);
            return tempFile;
        }).subscribeOn(reactor.core.scheduler.Schedulers.boundedElastic())
          .flatMap(tempFile -> extractTextFromFile(tempFile.toString())
                .doFinally(sig -> {
                    try {
                        Files.deleteIfExists(tempFile);
                    } catch (IOException e) {
                        log.warn("Failed to delete temp file", e);
                    }
                })
          );
    }

    private String readTextFile(File file) throws IOException {
        Path path = Paths.get(file.getAbsolutePath());
        return Files.readString(path, StandardCharsets.UTF_8);
    }

    private String performOcr(File file) throws TesseractException {
        ITesseract tesseract = new Tesseract();
        tesseract.setDatapath("./src/main/resources/tessdata");
        tesseract.setLanguage("vie+eng");
        return tesseract.doOCR(file);
    }

    private String getFileExtension(String fileName) {
        int lastIndexOfDot = fileName.lastIndexOf('.');
        if (lastIndexOfDot > 0 && lastIndexOfDot < fileName.length() - 1) {
            return fileName.substring(lastIndexOfDot + 1);
        }
        return "";
    }
}
