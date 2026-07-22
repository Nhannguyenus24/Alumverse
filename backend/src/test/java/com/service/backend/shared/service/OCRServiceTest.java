package com.service.backend.shared.service;

import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;
import reactor.test.StepVerifier;

import java.nio.file.Path;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OCRServiceTest {

    @TempDir
    Path tempDir;

    @Mock
    private DocumentExtractionService documentExtractionService;

    @Mock
    private VisionOcrService visionOcrService;

    @Test
    void extractTextFromFile_readsPdfTextLayer() throws Exception {
        Path pdf = createPdf("student.pdf", "Ho ten: Nguyen Van A", "MSSV: 22123456");
        when(documentExtractionService.extractFields(anyString())).thenAnswer(invocation -> invocation.getArgument(0));

        Mono<String> result = ocrService().extractTextFromFile(pdf.toString());

        StepVerifier.create(result)
                .assertNext(text -> {
                    assertThat(text).contains("Ho ten: Nguyen Van A");
                    assertThat(text).contains("MSSV: 22123456");
                })
                .verifyComplete();
    }

    @Test
    void extractTextFromFile_capsPdfPages() throws Exception {
        Path pdf = createPdf("six-pages.pdf",
                "Page 1 MSSV: 22123451",
                "Page 2 MSSV: 22123452",
                "Page 3 MSSV: 22123453",
                "Page 4 MSSV: 22123454",
                "Page 5 MSSV: 22123455",
                "Page 6 MSSV: 22123456");
        when(documentExtractionService.extractFields(anyString())).thenAnswer(invocation -> invocation.getArgument(0));

        Mono<String> result = ocrService().extractTextFromFile(pdf.toString());

        StepVerifier.create(result)
                .assertNext(text -> {
                    assertThat(text).contains("Page 5 MSSV: 22123455");
                    assertThat(text).doesNotContain("Page 6 MSSV: 22123456");
                })
                .verifyComplete();
    }

    private OCRService ocrService() {
        return new OCRService(
                new SimpleMeterRegistry(),
                documentExtractionService,
                visionOcrService,
                Schedulers.boundedElastic());
    }

    private Path createPdf(String fileName, String... pages) throws Exception {
        Path path = tempDir.resolve(fileName);
        try (PDDocument document = new PDDocument()) {
            for (String pageText : pages) {
                PDPage page = new PDPage();
                document.addPage(page);
                try (PDPageContentStream content = new PDPageContentStream(document, page)) {
                    content.beginText();
                    content.setFont(PDType1Font.HELVETICA, 12);
                    content.newLineAtOffset(72, 720);
                    content.showText(pageText);
                    content.endText();
                }
            }
            document.save(path.toFile());
        }
        return path;
    }
}
