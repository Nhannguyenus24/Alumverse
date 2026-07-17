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
import java.util.Optional;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.web.multipart.MultipartFile;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;

/**
 * Service responsible for Optical Character Recognition (OCR) and text extraction.
 * Supports processing of PNG, JPEG, PDF, and plain TXT files.
 */
@Slf4j
@Service
public class OCRService {

    static {
        String osName = System.getProperty("os.name").toLowerCase();
        if (osName.contains("mac")) {
            String arch = System.getProperty("os.arch");
            String brewLibPath = "aarch64".equals(arch) ? "/opt/homebrew/lib" : "/usr/local/lib";
            try {
                com.sun.jna.NativeLibrary.addSearchPath("tesseract", brewLibPath);
            } catch (Throwable t) {
                // Ignore if JNA is not yet on classpath or fails
            }
        }
    }

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
     * Model vision trả về sẵn dạng trường nên khỏi trích lại; PDF text layer và Tesseract
     * thì ra nguyên văn giấy tờ (kèm URL, menu, bảng điểm...) nên phải rút gọn.
     */
    private record OcrResult(String text, boolean needsExtraction) {
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

                    return switch (extension) {
                        case "txt" -> new OcrResult(readTextFile(file), true);
                        case "png", "jpeg", "jpg" -> readImage(file, extension);
                        case "pdf" -> readPdf(file);
                        default -> throw new IllegalArgumentException("Unsupported file format: " + extension);
                    };
        }).subscribeOn(heavyTaskScheduler)
          .map(result -> {
              if (!result.needsExtraction()) {
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

    /**
     * PDF xuất từ máy (Word, hệ thống của trường...) đã có sẵn text layer: bóc thẳng ra thì
     * chính xác tuyệt đối và không tốn một token AI nào. Chỉ PDF scan (ảnh chụp lưu thành PDF,
     * không có text layer) mới phải OCR.
     */
    private OcrResult readPdf(File file) throws TesseractException {
        try (PDDocument document = PDDocument.load(file)) {
            String text = new PDFTextStripper().getText(document);
            if (text != null && !text.isBlank()) {
                log.info("PDF '{}' có sẵn text layer — bóc trực tiếp, không cần OCR.", file.getName());
                // Text layer là nguyên văn cả trang (kèm URL, menu, bảng điểm) nên vẫn phải rút gọn.
                return new OcrResult(text.trim(), true);
            }
            log.info("PDF '{}' không có text layer (bản scan) — chuyển sang OCR.", file.getName());
        } catch (IOException e) {
            log.warn("Không đọc được text layer của PDF '{}', chuyển sang OCR: {}", file.getName(), e.getMessage());
        }
        return new OcrResult(performOcr(file), true);
    }

    /**
     * Ảnh thì để model vision đọc thẳng vì nó "nhìn" được bố cục giấy tờ; Tesseract chỉ dùng khi
     * vision tắt / lỗi / không đọc nổi. Chữ vision trả về đã sạch nên không cần dọn thêm.
     */
    private OcrResult readImage(File file, String extension) throws TesseractException {
        Optional<String> viaVision = visionOcrService.extractText(file, mimeTypeOf(extension));
        if (viaVision.isPresent()) {
            return new OcrResult(viaVision.get(), false);
        }
        return new OcrResult(performOcr(file), true);
    }

    private String mimeTypeOf(String extension) {
        return "png".equals(extension) ? "image/png" : "image/jpeg";
    }

    private String readTextFile(File file) throws IOException {
        Path path = Paths.get(file.getAbsolutePath());
        return Files.readString(path, StandardCharsets.UTF_8);
    }

    private String performOcr(File file) throws TesseractException {
        Timer.Sample sample = Timer.start(meterRegistry);
        try {
            File tessDataFolder = new File("./src/main/resources/tessdata");
            if (!tessDataFolder.exists() || !tessDataFolder.isDirectory()) {
                throw new IllegalStateException("tessdata folder not found at " + tessDataFolder.getAbsolutePath() + ". Tesseract requires language data files.");
            }
            
            ITesseract tesseract = new Tesseract();
            tesseract.setDatapath(tessDataFolder.getAbsolutePath());
            tesseract.setLanguage("vie+eng");
            // Set thread limit to 1 to prevent SIGSEGV on Apple Silicon / macOS
            tesseract.setTessVariable("omp_thread_limit", "1");
            return tesseract.doOCR(file);
        } finally {
            sample.stop(meterRegistry.timer("ocr.processing.time"));
        }
    }

    private String getFileExtension(String fileName) {
        int lastIndexOfDot = fileName.lastIndexOf('.');
        if (lastIndexOfDot > 0 && lastIndexOfDot < fileName.length() - 1) {
            return fileName.substring(lastIndexOfDot + 1);
        }
        return "";
    }
}
