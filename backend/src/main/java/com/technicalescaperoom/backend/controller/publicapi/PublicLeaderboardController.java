package com.technicalescaperoom.backend.controller.publicapi;

import com.technicalescaperoom.backend.dto.publicapi.PublicLeaderboardDto;
import com.technicalescaperoom.backend.service.admin.LeaderboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/public/events/{eventId}")
@RequiredArgsConstructor
public class PublicLeaderboardController {

    private final LeaderboardService leaderboardService;

    @GetMapping("/leaderboard")
    public ResponseEntity<PublicLeaderboardDto> getPublicLeaderboard(@PathVariable Long eventId) {
        PublicLeaderboardDto dto = leaderboardService.getPublicLeaderboard(eventId);
        return ResponseEntity.ok(dto);
    }
}
