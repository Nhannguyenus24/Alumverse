package com.service.backend.shared.utils;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;

/**
 * Utility class for consistent timezone handling
 * All times in the system use Asia/Ho_Chi_Minh (UTC+7) timezone
 */
public class TimeUtils {

    /**
     * Vietnam timezone (UTC+7)
     */
    public static final ZoneId VIETNAM_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    /**
     * Vietnam zone offset (+07:00)
     */
    public static final ZoneOffset VIETNAM_OFFSET = ZoneOffset.ofHours(7);

    /**
     * Get current time in Vietnam timezone
     * @return current LocalDateTime in UTC+7
     */
    public static LocalDateTime now() {
        return LocalDateTime.now(VIETNAM_ZONE);
    }

    /**
     * Get current instant
     * @return current Instant
     */
    public static Instant nowInstant() {
        return Instant.now();
    }

    /**
     * Convert LocalDateTime to Instant using Vietnam timezone
     * @param dateTime the local date time
     * @return instant
     */
    public static Instant toInstant(LocalDateTime dateTime) {
        return dateTime.atZone(VIETNAM_ZONE).toInstant();
    }

    /**
     * Convert LocalDateTime to epoch seconds using Vietnam timezone
     * @param dateTime the local date time
     * @return epoch seconds
     */
    public static long toEpochSecond(LocalDateTime dateTime) {
        return dateTime.atZone(VIETNAM_ZONE).toEpochSecond();
    }

    /**
     * Convert Instant to LocalDateTime using Vietnam timezone
     * @param instant the instant
     * @return local date time in Vietnam timezone
     */
    public static LocalDateTime toLocalDateTime(Instant instant) {
        return LocalDateTime.ofInstant(instant, VIETNAM_ZONE);
    }

    /**
     * Convert epoch seconds to LocalDateTime using Vietnam timezone
     * @param epochSecond epoch seconds
     * @return local date time in Vietnam timezone
     */
    public static LocalDateTime fromEpochSecond(long epochSecond) {
        return LocalDateTime.ofEpochSecond(epochSecond, 0, VIETNAM_OFFSET);
    }
}

