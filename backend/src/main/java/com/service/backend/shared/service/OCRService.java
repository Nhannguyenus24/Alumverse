package com.service.backend.shared.service;

import lombok.extern.slf4j.Slf4j;

import org.springframework.stereotype.Service;

import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.geom.AffineTransform;
import java.awt.image.BufferedImage;
import java.io.File;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Optional;

import javax.imageio.ImageIO;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.rendering.ImageType;
import org.apache.pdfbox.rendering.PDFRenderer;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.web.multipart.MultipartFile;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;
import io.micrometer.core.instrument.MeterRegistry;

/**
 * Service responsible for Optical Character Recognition (OCR) and text extraction.
 * Supports processing of PNG, JPEG, PDF, and plain TXT files.
 */
@Slf4j
@Service
public class OCRService {



    private static final int MAX_PDF_OCR_PAGES = 5;
    private static final float PDF_RENDER_DPI = 200f;
    private static final int MIN_TEXT_LAYER_CHARS = 20;
    private static final String UNREADABLE = "UNREADABLE";

    private final MeterRegistry meterRegistry;
    private final DocumentExtractionService documentExtractionService;
    private final VisionOcrService visionOcrService;
    private final Scheduler heavyTaskScheduler;

    public OCRService(MeterRegistry meterRegistry, DocumentExtractionService documentExtractionService,
                      VisionOcrService visionOcrService,
                      @Qualifier("heavyTaskScheduler") Scheduler heavyTaskScheduler) {
        this.meterRegistry = meterRegistry;
        this.documentExtractionService = documentExtractionService;
        this.visionOcrService = visionOcrService;
        this.heavyTaskScheduler = heavyTaskScheduler;
    }

    /**
     * Kết quả OCR kèm cờ cho biết chữ còn ở dạng thô hay đã là các trường đối chiếu.
     * Model vision trả về sẵn dạng trường nên khỏi trích lại; PDF text layer
     * thì ra nguyên văn giấy tờ nên phải rút gọn.
     */
    private record OcrResult(String text, boolean needsExtraction) {
    }

    /**
     * Extracts text content from a given file path.
     * Supported formats: PNG, JPEG, JPG, PDF, TXT.
     */
    public Mono<String> extractTextFromFile(String filePath) {
        return extractTextFromFile(filePath, true);
    }

    public Mono<String> extractRawTextFromFile(String filePath) {
        return extractTextFromFile(filePath, false);
    }

    private Mono<String> extractTextFromFile(String filePath, boolean extractDocumentFields) {
        if (filePath == null || filePath.trim().isEmpty()) {
            return Mono.error(new IllegalArgumentException("File path cannot be null or empty."));
        }

        return Mono.fromCallable(() -> {
            File file = new File(filePath);
            if (!file.exists() || !file.isFile()) {
                throw new IllegalArgumentException("File does not exist or is not a valid file: " + filePath);
            }

            String extension = getFileExtension(file.getName()).toLowerCase();

                    return switch (extension) {
                        case "txt" -> new OcrResult(readTextFile(file), true);
                        case "png", "jpeg", "jpg" -> readImage(file, extension);
                        case "pdf" -> readPdf(file);
                        default -> throw new IllegalArgumentException("Unsupported file format: " + extension);
                    };
        }).subscribeOn(heavyTaskScheduler)
          .map(result -> {
              if (!extractDocumentFields || !result.needsExtraction()) {
                  return result.text();
              }
              try {
                  return documentExtractionService.extractFields(result.text());
              } catch (Exception e) {
                  log.warn("Document extraction failed, returning raw text", e);
                  return result.text();
              }
          })
          .onErrorMap(IOException.class, e -> {
              log.error("Failed to read text file: {}", filePath, e);
              return new RuntimeException("Error reading text file: " + e.getMessage(), e);
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

    /**
     * PDF bảng điểm/bằng cấp có thể vừa có text layer vừa có trang scan. Đọc từng trang để
     * trang scan vẫn đi qua pipeline ảnh (vision + xoay) thay vì OCR PDF trực tiếp.
     */
    private OcrResult readPdf(File file) {
        try (PDDocument document = PDDocument.load(file)) {
            int pagesToRead = Math.min(document.getNumberOfPages(), MAX_PDF_OCR_PAGES);
            log.info("PDF '{}' đọc {} / {} trang.", file.getName(), pagesToRead, document.getNumberOfPages());

            PDFRenderer renderer = new PDFRenderer(document);
            StringBuilder text = new StringBuilder();
            for (int pageIndex = 0; pageIndex < pagesToRead; pageIndex++) {
                String pageText = extractPdfPageText(document, pageIndex + 1);
                if (!hasUsefulTextLayer(pageText)) {
                    pageText = ocrPdfPage(renderer, pageIndex, file.getName());
                }
                appendPageText(text, pageIndex + 1, pageText);
            }

            String result = text.toString().trim();
            return new OcrResult(result.isBlank() ? UNREADABLE : result, true);
        } catch (IOException e) {
            log.warn("Không đọc được PDF '{}': {}", file.getName(), e.getMessage());
            return new OcrResult(UNREADABLE, true);
        }
    }

    private String extractPdfPageText(PDDocument document, int pageNumber) throws IOException {
        PDFTextStripper stripper = new PDFTextStripper();
        stripper.setStartPage(pageNumber);
        stripper.setEndPage(pageNumber);
        return stripper.getText(document);
    }

    private boolean hasUsefulTextLayer(String text) {
        if (text == null) {
            return false;
        }
        String trimmed = text.trim();
        String lower = trimmed.toLowerCase();
        return trimmed.length() >= MIN_TEXT_LAYER_CHARS
                || lower.contains("mssv")
                || lower.contains("họ tên")
                || lower.contains("ho ten")
                || trimmed.matches(".*\\b\\d{8,}\\b.*");
    }

    private String ocrPdfPage(PDFRenderer renderer, int pageIndex, String pdfName) {
        Path tempPage = null;
        try {
            tempPage = Files.createTempFile("ocr_pdf_page_", ".png");
            BufferedImage image = renderer.renderImageWithDPI(pageIndex, PDF_RENDER_DPI, ImageType.RGB);
            ImageIO.write(image, "png", tempPage.toFile());
            return readImage(tempPage.toFile(), "png").text();
        } catch (IOException | RuntimeException e) {
            log.warn("Không OCR được trang {} của PDF '{}': {}", pageIndex + 1, pdfName, e.getMessage());
            return "";
        } finally {
            if (tempPage != null) {
                try {
                    Files.deleteIfExists(tempPage);
                } catch (IOException e) {
                    log.warn("Không xóa được ảnh PDF tạm '{}': {}", tempPage, e.getMessage());
                }
            }
        }
    }

    private void appendPageText(StringBuilder out, int pageNumber, String text) {
        if (text == null || text.isBlank()) {
            return;
        }
        if (!out.isEmpty()) {
            out.append("\n\n");
        }
        out.append("Trang ").append(pageNumber).append(":\n").append(text.trim());
    }

    /**
     * Ảnh được xử lý thông qua AI Vision Model vì nó "nhìn" được bố cục giấy tờ
     * và trả về dữ liệu có cấu trúc.
     */
    private OcrResult readImage(File file, String extension) {
        String mimeType = mimeTypeOf(extension);
        Optional<String> viaVision = extractVisionWithRotations(file, extension, mimeType);
        if (viaVision.isPresent()) {
            return new OcrResult(viaVision.get(), false);
        }
        throw new RuntimeException("Vision OCR failed or disabled for file: " + file.getName());
    }

    private Optional<String> extractVisionWithRotations(File file, String extension, String mimeType) {
        Optional<String> original = visionOcrService.extractText(file, mimeType);
        int bestScore = original.map(OCRService::identityEvidenceScore).orElse(0);
        if (bestScore >= 5) {
            return original;
        }

        Optional<String> best = original;
        // 180° first because upside-down phone photos are the most common orientation error.
        for (int degrees : new int[] {180, 90, 270}) {
            Optional<String> rotatedText = withRotatedImage(file, extension, degrees,
                    rotated -> visionOcrService.extractText(rotated, mimeType));
            int score = rotatedText.map(OCRService::identityEvidenceScore).orElse(0);
            if (score > bestScore) {
                best = rotatedText;
                bestScore = score;
            }
            if (bestScore >= 5) {
                break;
            }
        }
        return best;
    }

    /** Scores identity evidence so a weak, wrongly-oriented OCR result does not stop rotation attempts. */
    static int identityEvidenceScore(String text) {
        if (text == null || text.isBlank()) return 0;
        String normalized = java.text.Normalizer.normalize(text, java.text.Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "")
                .toLowerCase();
        int score = 0;
        if (normalized.contains("mssv") || normalized.contains("ma so sinh vien")) score += 3;
        if (normalized.contains("ho ten") || normalized.contains("ho va ten")) score += 3;
        if (normalized.matches("(?s).*\\b\\d{8,}\\b.*")) score += 3;
        if (normalized.contains("loai giay to") || normalized.contains("the sinh vien")) score += 1;
        return score;
    }



    private Optional<String> withRotatedImage(File file, String extension, int degrees, ImageReader reader) {
        Path rotated = null;
        try {
            rotated = Files.createTempFile("ocr_rotate_", "." + extension);
            rotateImage(file, rotated.toFile(), degrees, extension);
            return reader.read(rotated.toFile());
        } catch (IOException e) {
            log.warn("Không xoay được ảnh '{}' {}°: {}", file.getName(), degrees, e.getMessage());
            return Optional.empty();
        } finally {
            if (rotated != null) {
                try {
                    Files.deleteIfExists(rotated);
                } catch (IOException e) {
                    log.warn("Không xóa được ảnh tạm '{}': {}", rotated, e.getMessage());
                }
            }
        }
    }

    private void rotateImage(File source, File target, int degrees, String extension) throws IOException {
        BufferedImage input = ImageIO.read(source);
        if (input == null) {
            throw new IOException("Unsupported image data");
        }

        double radians = Math.toRadians(degrees);
        int width = input.getWidth();
        int height = input.getHeight();
        int rotatedWidth = degrees == 180 ? width : height;
        int rotatedHeight = degrees == 180 ? height : width;
        BufferedImage output = new BufferedImage(rotatedWidth, rotatedHeight, BufferedImage.TYPE_INT_RGB);

        Graphics2D graphics = output.createGraphics();
        try {
            graphics.setColor(Color.WHITE);
            graphics.fillRect(0, 0, rotatedWidth, rotatedHeight);
            graphics.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BICUBIC);
            AffineTransform transform = new AffineTransform();
            transform.translate(rotatedWidth / 2.0, rotatedHeight / 2.0);
            transform.rotate(radians);
            transform.translate(-width / 2.0, -height / 2.0);
            graphics.drawRenderedImage(input, transform);
        } finally {
            graphics.dispose();
        }

        ImageIO.write(output, imageIoFormat(extension), target);
    }

    private String imageIoFormat(String extension) {
        return "png".equals(extension) ? "png" : "jpg";
    }

    @FunctionalInterface
    private interface ImageReader {
        Optional<String> read(File file);
    }

    private String mimeTypeOf(String extension) {
        return "png".equals(extension) ? "image/png" : "image/jpeg";
    }

    private String readTextFile(File file) throws IOException {
        Path path = Paths.get(file.getAbsolutePath());
        return Files.readString(path, StandardCharsets.UTF_8);
    }



    private String getFileExtension(String fileName) {
        int lastIndexOfDot = fileName.lastIndexOf('.');
        if (lastIndexOfDot > 0 && lastIndexOfDot < fileName.length() - 1) {
            return fileName.substring(lastIndexOfDot + 1);
        }
        return "";
    }
}
