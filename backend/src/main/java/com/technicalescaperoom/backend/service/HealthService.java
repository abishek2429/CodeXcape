package com.technicalescaperoom.backend.service;

import com.technicalescaperoom.backend.dto.HealthResponseDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import javax.sql.DataSource;
import java.sql.Connection;
import java.time.Instant;

@Slf4j
@Service
@RequiredArgsConstructor
public class HealthService {

    private final DataSource dataSource;

    public HealthResponseDto checkHealth() {
        String dbStatus = checkDatabaseConnection();

        return HealthResponseDto.builder()
                .status("UP")
                .timestamp(Instant.now())
                .service("technical-escape-room-backend")
                .database(dbStatus)
                .version("1.0.0")
                .build();
    }

    private String checkDatabaseConnection() {
        try (Connection connection = dataSource.getConnection()) {
            if (connection.isValid(2)) {
                return "UP";
            } else {
                return "DOWN (Invalid Connection)";
            }
        } catch (Exception e) {
            log.error("Database health check failed: {}", e.getMessage());
            return "DOWN (" + e.getMessage() + ")";
        }
    }
}
