package com.technicalescaperoom.backend.controller.player;

import com.technicalescaperoom.backend.config.security.PlayerPrincipal;
import com.technicalescaperoom.backend.dto.player.TeamScoreDto;
import com.technicalescaperoom.backend.service.ScoringService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/player/game")
@RequiredArgsConstructor
public class PlayerScoreController {

    private final ScoringService scoringService;

    @GetMapping("/score")
    public ResponseEntity<TeamScoreDto> getMyTeamScore(@AuthenticationPrincipal PlayerPrincipal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).build();
        }
        TeamScoreDto scoreDto = scoringService.getTeamScoreSummary(principal.getTeamId());
        return ResponseEntity.ok(scoreDto);
    }
}
