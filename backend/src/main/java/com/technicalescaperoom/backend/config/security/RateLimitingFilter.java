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

    @org.springframework.beans.factory.annotation.Value("${app.rate-limiting.max-requests:10}")
    private int maxRequests = 10;

    @org.springframework.beans.factory.annotation.Value("${app.rate-limiting.window-seconds:10}")
    private long windowSeconds = 10;

    private final Map<String, RequestBucket> buckets = new ConcurrentHashMap<>();

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String uri = request.getRequestURI();

        if (isRateLimitedEndpoint(request)) {
            String clientKey = resolveClientKey(request);
            long now = Instant.now().getEpochSecond();

            RequestBucket bucket = buckets.compute(clientKey, (key, existing) -> {
                if (existing == null || (now - existing.windowStartEpoch) > windowSeconds) {
                    return new RequestBucket(now, 1);
                } else {
                    existing.requestCount++;
                    return existing;
                }
            });

            cleanupExpiredBuckets(now);

            if (bucket.requestCount > maxRequests) {
                log.warn("Rate limit exceeded for client key {} on URI {}", clientKey, uri);
                sendRateLimitError(response);
                return;
            }
        }

        filterChain.doFilter(request, response);
    }

    private boolean isRateLimitedEndpoint(HttpServletRequest request) {
        String method = request.getMethod();
        String uri = request.getRequestURI();
        return "POST".equalsIgnoreCase(method) &&
                (uri.equals("/api/player/game/current/answer") ||
                 uri.equals("/api/player/game/final-passkey"));
    }

    private String resolveClientKey(HttpServletRequest request) {
        // 1. Check Header X-Player-Session
        String sessionHeader = request.getHeader("X-Player-Session");
        if (sessionHeader != null && !sessionHeader.isBlank()) {
            return sessionHeader.trim();
        }

        // 2. Check Header X-Admin-Session
        String adminHeader = request.getHeader("X-Admin-Session");
        if (adminHeader != null && !adminHeader.isBlank()) {
            return adminHeader.trim();
        }

        // 3. Check Authorization Bearer Token
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return authHeader.substring(7).trim();
        }

        // 4. Check Cookies (PLAYER_SESSION or ADMIN_SESSION)
        if (request.getCookies() != null) {
            for (jakarta.servlet.http.Cookie cookie : request.getCookies()) {
                if (("PLAYER_SESSION".equals(cookie.getName()) || "ADMIN_SESSION".equals(cookie.getName()))
                        && cookie.getValue() != null && !cookie.getValue().isBlank()) {
                    return cookie.getValue().trim();
                }
            }
        }

        // 5. Fallback to client IP (aware of reverse proxy X-Forwarded-For)
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isBlank()) {
            return xForwardedFor.split(",")[0].trim();
        }

        return request.getRemoteAddr();
    }

    private void cleanupExpiredBuckets(long now) {
        if (buckets.size() > 500) {
            buckets.entrySet().removeIf(entry -> (now - entry.getValue().windowStartEpoch) > windowSeconds * 2);
        }
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
