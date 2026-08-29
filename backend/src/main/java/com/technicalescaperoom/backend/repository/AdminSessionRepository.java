package com.technicalescaperoom.backend.repository;

import com.technicalescaperoom.backend.entity.AdminSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AdminSessionRepository extends JpaRepository<AdminSession, Long> {
    Optional<AdminSession> findBySessionToken(String sessionToken);
}
