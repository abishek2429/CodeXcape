package com.technicalescaperoom.backend.config.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Component
@RequiredArgsConstructor
public class RateLimitingFilter extends OncePerRequestFilter {

    private final ObjectMapper objectMapper;

    private static final int ANSWER_MAX_REQUESTS = 10;
    private static final int PLAYER_LOGIN_MAX_REQUESTS = 25;
    private static final int ADMIN_LOGIN_MAX_REQUESTS = 5;
    private static final long WINDOW_SECONDS = 10;

    private final Map<String, RequestBucket> buckets = new ConcurrentHashMap<>();

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        int maxAllowed = getMaxRequestsForEndpoint(request);

        if (maxAllowed > 0) {
            String clientKey = resolveClientKey(request, maxAllowed);
            long now = Instant.now().getEpochSecond();

            // Periodic cleanup of stale buckets when size grows
            if (buckets.size() > 500) {
                cleanupStaleBuckets(now);
            }

            RequestBucket bucket = buckets.compute(clientKey, (key, existing) -> {
                if (existing == null || (now - existing.windowStartEpoch) > WINDOW_SECONDS) {
                    return new RequestBucket(now, 1);
                } else {
                    existing.requestCount++;
                    return existing;
                }
            });

            if (bucket.requestCount > maxAllowed) {
                log.warn("Rate limit exceeded for client key {} on URI {}", clientKey, request.getRequestURI());
                sendRateLimitError(response);
                return;
            }
        }

        filterChain.doFilter(request, response);
    }

    private int getMaxRequestsForEndpoint(HttpServletRequest request) {
        String method = request.getMethod();
        String uri = request.getRequestURI();
        if (!"POST".equalsIgnoreCase(method)) {
            return 0;
        }

        if (uri.equals("/api/player/game/current/answer") || uri.equals("/api/player/game/final-passkey")) {
            return ANSWER_MAX_REQUESTS;
        }
        if (uri.equals("/api/player/login")) {
            return PLAYER_LOGIN_MAX_REQUESTS;
        }
        if (uri.equals("/api/admin/login")) {
            return ADMIN_LOGIN_MAX_REQUESTS;
        }
        return 0;
    }

    private void cleanupStaleBuckets(long now) {
        buckets.entrySet().removeIf(entry -> (now - entry.getValue().windowStartEpoch) > (WINDOW_SECONDS * 2));
    }

    private String resolveClientKey(HttpServletRequest request, int maxAllowed) {
        // For answer submissions, prioritize player session so campus NAT doesn't throttle teammate
        if (maxAllowed == ANSWER_MAX_REQUESTS) {
            String sessionHeader = request.getHeader("X-Player-Session");
            if (sessionHeader != null && !sessionHeader.isBlank()) {
                return sessionHeader.trim();
            }

            String authHeader = request.getHeader("Authorization");
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                return authHeader.substring(7).trim();
            }

            if (request.getCookies() != null) {
                for (jakarta.servlet.http.Cookie cookie : request.getCookies()) {
                    if ("PLAYER_SESSION".equals(cookie.getName()) && cookie.getValue() != null && !cookie.getValue().isBlank()) {
                        return cookie.getValue().trim();
                    }
                }
            }
        }

        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            return forwardedFor.split(",")[0].trim() + ":" + request.getRequestURI();
        }

        return request.getRemoteAddr() + ":" + request.getRequestURI();
    }

    private void sendRateLimitError(HttpServletResponse response) throws IOException {
        response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);

        Map<String, Object> errorDetails = new HashMap<>();
        errorDetails.put("status", HttpStatus.TOO_MANY_REQUESTS.value());
        errorDetails.put("error", "Too Many Requests");
        errorDetails.put("code", "RATE_LIMIT_EXCEEDED");
        errorDetails.put("message", "Rate limit exceeded. Please wait a few seconds before submitting again.");
        errorDetails.put("timestamp", Instant.now().toString());

        response.getWriter().write(objectMapper.writeValueAsString(errorDetails));
    }

    private static class RequestBucket {
        long windowStartEpoch;
        int requestCount;

        RequestBucket(long windowStartEpoch, int requestCount) {
            this.windowStartEpoch = windowStartEpoch;
            this.requestCount = requestCount;
        }
    }
}
