package com.service.backend.event.dto;

import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Check-in payload. Provide exactly one of:
 * <ul>
 *   <li>{@code qrToken} — the encrypted token scanned from the QR (preferred); or</li>
 *   <li>{@code code} — the raw ticket code, for the manual-entry fallback when a QR is damaged.</li>
 * </ul>
 * Both are optional here (the service enforces the "exactly one" rule); the bounds below just
 * reject abusive payloads. A QR token is an encrypted blob, hence the larger cap.
 */
@Data
public class CheckInRequest {
    @Size(max = 4096)
    private String qrToken;

    @Size(max = 255)
    private String code;
}
