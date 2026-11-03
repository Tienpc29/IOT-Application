package com.ptit.iot.security;

import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.Duration;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class AuthTokenService {

    private static final Duration TOKEN_LIFETIME = Duration.ofHours(8);

    private final Map<String, TokenInfo> tokens = new ConcurrentHashMap<>();

    public String issue(String username) {
        String token = UUID.randomUUID().toString();
        tokens.put(token, new TokenInfo(username, Instant.now().plus(TOKEN_LIFETIME)));
        return token;
    }

    public String usernameOf(String token) {
        if (token == null || token.isBlank()) return null;

        TokenInfo info = tokens.get(token);
        if (info == null) return null;
        if (Instant.now().isAfter(info.expiresAt())) {
            tokens.remove(token);
            return null;
        }
        return info.username();
    }

    public void revoke(String token) {
        if (token != null && !token.isBlank()) {
            tokens.remove(token);
        }
    }

    private record TokenInfo(String username, Instant expiresAt) {
    }
}
