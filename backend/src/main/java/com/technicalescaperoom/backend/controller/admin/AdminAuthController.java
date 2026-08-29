package com.technicalescaperoom.backend.controller.admin;

import com.technicalescaperoom.backend.dto.admin.AdminLoginRequest;
import com.technicalescaperoom.backend.service.admin.AdminAuthService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminAuthController {

    public static final String ADMIN_COOKIE_NAME = "ADMIN_SESSION";
    private final AdminAuthService adminAuthService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody AdminLoginRequest request, HttpServletResponse response) {
        try {
            String token = adminAuthService.login(request.getPassword());

            Cookie cookie = new Cookie(ADMIN_COOKIE_NAME, token);
            cookie.setHttpOnly(true);
            cookie.setSecure(true); // Should be true in prod, but Vite dev server works with secure=false or secure=true depending on https. 
            // In Spring, we can dynamically set this or just set it based on a property, but usually true is fine if proxy is handling it.
            // Let's use standard cookie settings similar to Player.
            cookie.setPath("/");
            cookie.setMaxAge(24 * 60 * 60); // 24 hours
            response.addCookie(cookie);

            return ResponseEntity.ok(Map.of("message", "Login successful"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", e.getMessage()));
        }
    }
    
    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletResponse response) {
        Cookie cookie = new Cookie(ADMIN_COOKIE_NAME, null);
        cookie.setHttpOnly(true);
        cookie.setPath("/");
        cookie.setMaxAge(0);
        response.addCookie(cookie);
        return ResponseEntity.ok(Map.of("message", "Logged out"));
    }
}
