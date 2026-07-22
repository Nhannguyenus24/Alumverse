package com.service.backend.event.dto;

import jakarta.validation.constraints.*;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Check-in payload. Provide exactly one of:
 * <ul>
 *   <li>{@code qrToken} — the encrypted token scanned from the QR (preferred); or</li>
 *   <li>{@code code} — the raw ticket code, for the manual-entry fallback when a QR is damaged.</li>
 * </ul>
 */
@Data
public class CheckInRequest {
    @Size(max = 255)

    private String qrToken;
    @Size(max = 255)

    private String code;
}
