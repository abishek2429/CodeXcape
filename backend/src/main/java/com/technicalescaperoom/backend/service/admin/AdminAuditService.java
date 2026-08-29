package com.technicalescaperoom.backend.service.admin;

import com.technicalescaperoom.backend.config.security.AdminPrincipal;
import com.technicalescaperoom.backend.entity.AdminAuditLog;
import com.technicalescaperoom.backend.repository.AdminAuditLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminAuditService {

    private final AdminAuditLogRepository adminAuditLogRepository;

    @Transactional
    public void logAction(AdminPrincipal principal, String action, String target, String details) {
        String username = (principal != null) ? principal.getUsername() : "SYSTEM";
        String role = (principal != null && principal.getRole() != null) ? principal.getRole().name() : "ORGANIZER";

        AdminAuditLog auditLog = AdminAuditLog.builder()
                .adminUsername(username)
                .role(role)
                .action(action)
                .target(target)
                .details(details)
                .build();

        adminAuditLogRepository.save(auditLog);
        log.info("ADMIN AUDIT LOG: [{}] {} performed {} on target {}", role, username, action, target);
    }

    @Transactional(readOnly = true)
    public List<AdminAuditLog> getRecentAuditLogs() {
        return adminAuditLogRepository.findTop50ByOrderByCreatedAtDesc();
    }
}
