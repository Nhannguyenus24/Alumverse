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

/**
 * Service responsible for Optical Character Recognition (OCR) and text extraction.
 * Supports processing of PNG, JPEG, PDF, and plain TXT files.
 */
@Slf4j
@Service
public class OCRService {

    private final ITesseract tesseract;

    public OCRService() {
        this.tesseract = new Tesseract();
        this.tesseract.setDatapath("./src/main/resources/tessdata"); 
        
        // Configure Tesseract to use both Vietnamese and English
        this.tesseract.setLanguage("vie+eng");
    }

    /**
     * Extracts text content from a given file path.
     * Supported formats: PNG, JPEG, JPG, PDF, TXT.
     *
     * @param filePath The absolute or relative path to the file.
     * @return The extracted text as a String.
     * @throws IllegalArgumentException if the file does not exist or the extension is unsupported.
     * @throws RuntimeException         if an error occurs during file reading or OCR processing.
     */
    public String extractTextFromFile(String filePath) {
        if (filePath == null || filePath.trim().isEmpty()) {
            throw new IllegalArgumentException("File path cannot be null or empty.");
        }

        File file = new File(filePath);
        if (!file.exists() || !file.isFile()) {
            throw new IllegalArgumentException("File does not exist or is not a valid file: " + filePath);
        }

        String extension = getFileExtension(file.getName()).toLowerCase();

        try {
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
        } catch (IOException e) {
            log.error("Failed to read text file: {}", filePath, e);
            throw new RuntimeException("Error reading text file: " + e.getMessage(), e);
        } catch (TesseractException e) {
            log.error("OCR processing failed for file: {}", filePath, e);
            throw new RuntimeException("Error during OCR processing: " + e.getMessage(), e);
        }
    }

    /**
     * Extracts text content from a Spring MultipartFile.
     * This is useful for processing files uploaded directly from clients.
     *
     * @param file The uploaded MultipartFile.
     * @return The extracted text as a String.
     * @throws IOException        if an I/O error occurs writing the temporary file.
     * @throws TesseractException if an error occurs in the Tesseract engine.
     */
    public String extractTextFromMultipartFile(MultipartFile file) throws IOException, TesseractException {
        Path tempFile = Files.createTempFile("ocr_", "_" + file.getOriginalFilename());
        Files.copy(file.getInputStream(), tempFile, StandardCopyOption.REPLACE_EXISTING);
        try {
            return extractTextFromFile(tempFile.toString());
        } finally {
            Files.deleteIfExists(tempFile);
        }
    }

    /**
     * Reads text directly from a TXT file using Java I/O.
     *
     * @param file The TXT file.
     * @return The text content of the file.
     * @throws IOException if an I/O error occurs reading from the file.
     */
    private String readTextFile(File file) throws IOException {
        Path path = Paths.get(file.getAbsolutePath());
        return Files.readString(path, StandardCharsets.UTF_8);
    }

    /**
     * Performs OCR on an image or PDF file using Tess4J.
     *
     * @param file The image or PDF file.
     * @return The extracted text.
     * @throws TesseractException if an error occurs in the Tesseract engine.
     */
    private String performOcr(File file) throws TesseractException {
        // Tess4J's doOCR method handles both image files and PDF files automatically.
        return tesseract.doOCR(file);
    }

    /**
     * Extracts the extension from a filename.
     *
     * @param fileName The name of the file.
     * @return The file extension (without the dot), or empty string if not found.
     */
    private String getFileExtension(String fileName) {
        int lastIndexOfDot = fileName.lastIndexOf('.');
        if (lastIndexOfDot > 0 && lastIndexOfDot < fileName.length() - 1) {
            return fileName.substring(lastIndexOfDot + 1);
        }
        return "";
    }
}
