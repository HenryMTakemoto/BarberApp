package com.barberapp.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;

@Service
public class JwtService {

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration}")
    private long expirationTime;

    private static final String HMAC_ALGO = "HmacSHA256";

    public String generateToken(String email) {
        String header = "{\"alg\":\"HS256\",\"typ\":\"JWT\"}";
        long now = System.currentTimeMillis();
        long exp = now + expirationTime;

        String payload = "{\"sub\":\"" + email + "\",\"iat\":" + now / 1000 + ",\"exp\":" + exp / 1000 + "}";

        String encodedHeader = encode(header.getBytes(StandardCharsets.UTF_8));
        String encodedPayload = encode(payload.getBytes(StandardCharsets.UTF_8));

        String signature = sign(encodedHeader + "." + encodedPayload);

        return encodedHeader + "." + encodedPayload + "." + signature;
    }

    public String extractEmail(String token) {
        try {
            String[] parts = token.split("\\.");
            if (parts.length != 3)
                return null;

            String payload = new String(decode(parts[1]), StandardCharsets.UTF_8);

            // Busca simples na string para extrair o valor de "sub"
            int subIndex = payload.indexOf("\"sub\":\"");
            if (subIndex != -1) {
                int start = subIndex + 7;
                int end = payload.indexOf("\"", start);
                return payload.substring(start, end);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }

    public boolean isTokenValid(String token, String email) {
        String[] parts = token.split("\\.");
        if (parts.length != 3)
            return false;

        String encodedHeader = parts[0];
        String encodedPayload = parts[1];
        String signature = parts[2];

        String expectedSignature = sign(encodedHeader + "." + encodedPayload);

        if (!signature.equals(expectedSignature)) {
            return false;
        }

        String extractedEmail = extractEmail(token);
        if (extractedEmail == null || !extractedEmail.equals(email)) {
            return false;
        }

        return !isTokenExpired(token);
    }

    private boolean isTokenExpired(String token) {
        try {
            String[] parts = token.split("\\.");
            String payload = new String(decode(parts[1]), StandardCharsets.UTF_8);

            int expIndex = payload.indexOf("\"exp\":");
            if (expIndex != -1) {
                int start = expIndex + 6;
                int end = payload.indexOf(",", start);
                if (end == -1) {
                    end = payload.indexOf("}", start);
                }
                long exp = Long.parseLong(payload.substring(start, end).trim());
                return (exp * 1000) < System.currentTimeMillis();
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return true; // se não for possível fazer o parse, considera como expirado
    }

    private String sign(String data) {
        try {
            Mac mac = Mac.getInstance(HMAC_ALGO);
            SecretKeySpec secretKey = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), HMAC_ALGO);
            mac.init(secretKey);
            byte[] signatureBytes = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            return encode(signatureBytes);
        } catch (NoSuchAlgorithmException | InvalidKeyException e) {
            throw new RuntimeException("Error signing JWT", e);
        }
    }

    private String encode(byte[] bytes) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private byte[] decode(String str) {
        return Base64.getUrlDecoder().decode(str);
    }
}
