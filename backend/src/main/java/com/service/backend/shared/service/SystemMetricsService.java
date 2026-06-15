package com.service.backend.shared.service;

import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.stereotype.Service;

import com.sun.management.OperatingSystemMXBean;
import java.lang.management.ManagementFactory;

/**
 * Service to register custom system metrics like OS-level RAM usage.
 */
@Service
public class SystemMetricsService {

    public SystemMetricsService(MeterRegistry meterRegistry) {
        OperatingSystemMXBean osBean = ManagementFactory.getPlatformMXBean(OperatingSystemMXBean.class);

        // Đăng ký đo lường System RAM
        meterRegistry.gauge("system.memory.total", osBean, OperatingSystemMXBean::getTotalMemorySize);
        meterRegistry.gauge("system.memory.free", osBean, OperatingSystemMXBean::getFreeMemorySize);
        meterRegistry.gauge("system.memory.used", osBean, bean -> bean.getTotalMemorySize() - bean.getFreeMemorySize());
    }
}
