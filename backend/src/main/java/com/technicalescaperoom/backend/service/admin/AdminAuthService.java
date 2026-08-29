package com.technicalescaperoom.backend.service.admin;

import com.technicalescaperoom.backend.entity.AdminSession;
import com.technicalescaperoom.backend.enums.SessionStatus;
import com.technicalescaperoom.backend.repository.AdminSessionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminAuthService {

    private final AdminSessionRepository adminSessionRepository;

    @Value("${app.admin.password:admin123}")
    private String adminPassword;

    public String login(String password) {
        if (!adminPassword.equals(password)) {
            throw new IllegalArgumentException("Invalid admin password");
        }

        String sessionToken = UUID.randomUUID().toString() + "-" + Instant.now().toEpochMilli();
        
        AdminSession session = AdminSession.builder()
                .sessionToken(sessionToken)
                .status(SessionStatus.ACTIVE)
                .build();
                
        adminSessionRepository.save(session);
        log.info("Admin successfully logged in. Issued session {}", sessionToken);
        
        return sessionToken;
    }
}
