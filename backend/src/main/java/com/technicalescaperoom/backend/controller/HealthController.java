package com.technicalescaperoom.backend.controller;

import com.technicalescaperoom.backend.dto.HealthResponseDto;
import com.technicalescaperoom.backend.service.HealthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/health")
@RequiredArgsConstructor
public class HealthController {

    private final HealthService healthService;

    @GetMapping
    public ResponseEntity<HealthResponseDto> getHealth() {
        HealthResponseDto health = healthService.checkHealth();
        return ResponseEntity.ok(health);
    }
}
