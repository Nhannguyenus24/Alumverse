package com.service.backend.event.service;

import com.nimbusds.jose.EncryptionMethod;
import com.nimbusds.jose.JOSEException;
import com.nimbusds.jose.JWEAlgorithm;
import com.nimbusds.jose.JWEHeader;
import com.nimbusds.jose.crypto.DirectDecrypter;
import com.nimbusds.jose.crypto.DirectEncrypter;
import com.nimbusds.jwt.EncryptedJWT;
import com.nimbusds.jwt.JWTClaimsSet;
import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.service.backend.shared.enums.ErrorCode;
import com.service.backend.shared.exception.ApplicationException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.text.ParseException;
import java.time.Instant;
import java.util.Base64;
import java.util.EnumMap;
import java.util.Map;
import java.util.Date;

/**
 * Encrypts/decrypts the payload embedded in an event ticket QR code.
 *
 * <p>The QR no longer carries the raw {@code ticketCode}. Instead it carries an AES-256-GCM
 * encrypted JWE (Nimbus, {@code dir} + {@code A256GCM}) over the claims {@code {tc, ev, exp}}.
 * Only the server (which holds the key) can read or forge it, so the code is hidden, the QR is
 * tamper-proof, and it is bound to a single event and a finite lifetime.</p>
 *
 * <p>The key is derived from the existing {@code jwt.secret} via SHA-256 (always 32 bytes), so no
 * new secret needs provisioning. Rotating {@code jwt.secret} invalidates previously rendered QRs;
 * since clients re-fetch the token whenever they open their ticket, that self-heals.</p>
 */
@Slf4j
@Component
public class EventQrService {

    /** Marker prefix so scanners can distinguish the encrypted token from the legacy format. */
    public static final String QR_PREFIX = "ALUMVERSE-TKT2-";

    private final long ttlMillis;
    private final DirectEncrypter encrypter;
    private final DirectDecrypter decrypter;

    public EventQrService(@Value("${jwt.secret}") String secret,
                          @Value("${event.qr.ttl-days:30}") long ttlDays) {
        try {
            byte[] key = MessageDigest.getInstance("SHA-256").digest(secret.getBytes(StandardCharsets.UTF_8));
            this.ttlMillis = ttlDays * 24L * 60L * 60L * 1000L;
            this.encrypter = new DirectEncrypter(key);
            this.decrypter = new DirectDecrypter(key);
        } catch (NoSuchAlgorithmException | JOSEException e) {
            throw new ApplicationException(ErrorCode.INTERNAL_SERVER_ERROR, "Failed to initialize QR cipher");
        }
    }

    /** Encrypt a ticket reference into a compact JWE string and prefix it for the QR. */
    public String encodeWithPrefix(String ticketCode, Long eventId) {
        return QR_PREFIX + encode(ticketCode, eventId);
    }

    /** Render the QR token as a PNG data URI for embedding in email HTML. */
    public String toQrCodeDataUri(String token) {
        try {
            Map<EncodeHintType, Object> hints = new EnumMap<>(EncodeHintType.class);
            hints.put(EncodeHintType.MARGIN, 1);
            BitMatrix matrix = new QRCodeWriter().encode(token, BarcodeFormat.QR_CODE, 320, 320, hints);
            try (ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
                MatrixToImageWriter.writeToStream(matrix, "PNG", outputStream);
                return "data:image/png;base64," + Base64.getEncoder().encodeToString(outputStream.toByteArray());
            }
        } catch (WriterException | java.io.IOException e) {
            throw new ApplicationException(ErrorCode.INTERNAL_SERVER_ERROR, "Failed to generate QR image");
        }
    }

    private String encode(String ticketCode, Long eventId) {
        try {
            Instant now = Instant.now();
            JWTClaimsSet claims = new JWTClaimsSet.Builder()
                    .claim("tc", ticketCode)
                    .claim("ev", eventId)
                    .issueTime(Date.from(now))
                    .expirationTime(Date.from(now.plusMillis(ttlMillis)))
                    .build();
            EncryptedJWT jwt = new EncryptedJWT(
                    new JWEHeader(JWEAlgorithm.DIR, EncryptionMethod.A256GCM), claims);
            jwt.encrypt(encrypter);
            return jwt.serialize();
        } catch (JOSEException e) {
            throw new ApplicationException(ErrorCode.INTERNAL_SERVER_ERROR, "Failed to encode QR token");
        }
    }

    /**
     * Decrypt + validate a QR token (the {@link #QR_PREFIX} is optional). Throws
     * {@link ApplicationException} with {@link ErrorCode#TICKET_QR_INVALID} / {@link ErrorCode#TICKET_QR_EXPIRED}
     * on any failure so the cause never leaks decryption internals.
     */
    public QrTicketRef decode(String token) {
        if (token == null || token.isBlank()) {
            throw new ApplicationException(ErrorCode.TICKET_QR_INVALID, "Empty QR token");
        }
        String raw = token.trim();
        if (raw.length() >= QR_PREFIX.length()
                && raw.substring(0, QR_PREFIX.length()).equalsIgnoreCase(QR_PREFIX)) {
            raw = raw.substring(QR_PREFIX.length());
        }
        try {
            EncryptedJWT jwt = EncryptedJWT.parse(raw);
            jwt.decrypt(decrypter);
            JWTClaimsSet claims = jwt.getJWTClaimsSet();
            Date exp = claims.getExpirationTime();
            if (exp != null && exp.before(new Date())) {
                throw new ApplicationException(ErrorCode.TICKET_QR_EXPIRED, "QR code has expired");
            }
            String ticketCode = claims.getStringClaim("tc");
            Long eventId = claims.getLongClaim("ev");
            if (ticketCode == null || eventId == null) {
                throw new ApplicationException(ErrorCode.TICKET_QR_INVALID, "Invalid QR payload");
            }
            return new QrTicketRef(ticketCode, eventId);
        } catch (ParseException | JOSEException e) {
            throw new ApplicationException(ErrorCode.TICKET_QR_INVALID, "Invalid QR token");
        }
    }

    /** Decoded reference carried by a ticket QR. */
    public record QrTicketRef(String ticketCode, Long eventId) {}
}
