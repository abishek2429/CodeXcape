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

    private static final int MAX_REQUESTS = 10;
    private static final long WINDOW_SECONDS = 10;

    private final Map<String, RequestBucket> buckets = new ConcurrentHashMap<>();

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String uri = request.getRequestURI();

        if (isRateLimitedEndpoint(request)) {
            String clientKey = resolveClientKey(request);
            long now = Instant.now().getEpochSecond();

            RequestBucket bucket = buckets.compute(clientKey, (key, existing) -> {
                if (existing == null || (now - existing.windowStartEpoch) > WINDOW_SECONDS) {
                    return new RequestBucket(now, 1);
                } else {
                    existing.requestCount++;
                    return existing;
                }
            });

            if (bucket.requestCount > MAX_REQUESTS) {
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
                (uri.equals("/api/player/game/current/answer") || uri.equals("/api/player/game/final-passkey"));
    }

    private String resolveClientKey(HttpServletRequest request) {
        String sessionHeader = request.getHeader("X-Player-Session");
        if (sessionHeader != null && !sessionHeader.isBlank()) {
            return sessionHeader.trim();
        }
        return request.getRemoteAddr();
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
