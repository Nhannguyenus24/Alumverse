package com.service.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import reactor.core.scheduler.Scheduler;
import reactor.core.scheduler.Schedulers;

@Configuration
public class SchedulerConfig {

    /**
     * Dedicated bounded scheduler for heavy, long-running blocking work (Tesseract OCR and
     * Gemini AI calls). Isolating these from the shared {@code Schedulers.boundedElastic()}
     * stops a burst of slow OCR/AI tasks from starving the many short blocking I/O operations
     * (file, image, mail, login history, etc.) that also use boundedElastic.
     *
     * <p>This changes only which thread pool the offloaded work runs on — the work itself and
     * its result are identical.
     */
    @Bean(name = "heavyTaskScheduler", destroyMethod = "dispose")
    public Scheduler heavyTaskScheduler() {
        int threadCap = Math.max(4, Runtime.getRuntime().availableProcessors());
        return Schedulers.newBoundedElastic(threadCap, 1000, "heavy-task");
    }
}
