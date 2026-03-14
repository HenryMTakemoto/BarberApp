package com.barberapp.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Date;

@Service
public class JwtService {

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration}")
    private Long expiration;

    // ── Gera o token JWT manualmente
    public String generateToken(String email) {
        long now = System.currentTimeMillis();
        long exp = now + expiration;

        // Header
        String header = Base64.getUrlEncoder().withoutPadding()
                .encodeToString("{\"alg\":\"HS256\",\"typ\":\"JWT\"}"
                        .getBytes(StandardCharsets.UTF_8));

        // Payload
        String payloadJson = String.format(
                "{\"sub\":\"%s\",\"iat\":%d,\"exp\":%d}",
                email, now / 1000, exp / 1000);
        String payload = Base64.getUrlEncoder().withoutPadding()
                .encodeToString(payloadJson.getBytes(StandardCharsets.UTF_8));

        // Signature
        String signature = sign(header + "." + payload);

        return header + "." + payload + "." + signature;
    }

    // Extrai o email do token
    public String extractEmail(String token) {
        String payload = decodePayload(token);
        // Pega o valor do campo "sub"
        String sub = extractField(payload, "sub");
        return sub;
    }

    // Valida se o token é legítimo e não expirou
    public boolean isTokenValid(String token, String email) {
        try {
            String[] parts = token.split("\\.");
            if (parts.length != 3) return false;

            // Revalida a assinatura
            String expectedSig = sign(parts[0] + "." + parts[1]);
            if (!expectedSig.equals(parts[2])) return false;

            // Valida expiração
            String payload = decodePayload(token);
            String expStr = extractField(payload, "exp");
            long expTime = Long.parseLong(expStr) * 1000;
            if (new Date().getTime() > expTime) return false;

            // Valida email
            return email.equals(extractEmail(token));

        } catch (Exception e) {
            return false;
        }
    }

    // Helpers privados

    private String sign(String data) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec keySpec = new SecretKeySpec(
                    secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            mac.init(keySpec);
            byte[] rawHmac = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(rawHmac);
        } catch (Exception e) {
            throw new RuntimeException("Erro ao assinar token JWT", e);
        }
    }

    private String decodePayload(String token) {
        String[] parts = token.split("\\.");
        byte[] decoded = Base64.getUrlDecoder().decode(parts[1]);
        return new String(decoded, StandardCharsets.UTF_8);
    }

    private String extractField(String json, String field) {
        // Busca: "field":"value" ou "field":123
        String key = "\"" + field + "\":";
        int start = json.indexOf(key);
        if (start == -1) return null;
        start += key.length();

        boolean isString = json.charAt(start) == '"';
        if (isString) {
            start++; // pula a aspa de abertura
            int end = json.indexOf('"', start);
            return json.substring(start, end);
        } else {
            int end = json.indexOf(',', start);
            if (end == -1) end = json.indexOf('}', start);
            return json.substring(start, end).trim();
        }
    }
}