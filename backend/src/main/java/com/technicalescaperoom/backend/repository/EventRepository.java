package com.technicalescaperoom.backend.repository;

import com.technicalescaperoom.backend.entity.Event;
import com.technicalescaperoom.backend.enums.EventStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EventRepository extends JpaRepository<Event, Long> {
    List<Event> findByStatus(EventStatus status);
}
