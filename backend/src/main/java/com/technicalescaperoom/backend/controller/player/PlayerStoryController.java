package com.technicalescaperoom.backend.controller.player;

import com.technicalescaperoom.backend.config.security.PlayerPrincipal;
import com.technicalescaperoom.backend.dto.story.ActiveStoryStateDto;
import com.technicalescaperoom.backend.service.CinematicStoryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/player/game/story")
@RequiredArgsConstructor
public class PlayerStoryController {

    private final CinematicStoryService cinematicStoryService;

    @GetMapping("/current")
    public ResponseEntity<ActiveStoryStateDto> getCurrentStoryState(@AuthenticationPrincipal PlayerPrincipal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).build();
        }
        ActiveStoryStateDto state = cinematicStoryService.getCurrentStoryState(principal.getTeamId());
        return ResponseEntity.ok(state);
    }

    @PostMapping("/skip")
    public ResponseEntity<ActiveStoryStateDto> skipStory(@AuthenticationPrincipal PlayerPrincipal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).build();
        }
        log.info("Player {} (Team {}) requested STORY SKIP", principal.getPlayerId(), principal.getTeamId());
        ActiveStoryStateDto state = cinematicStoryService.skipStory(principal.getTeamId(), principal.getPlayerId());
        return ResponseEntity.ok(state);
    }

    @PostMapping("/complete")
    public ResponseEntity<ActiveStoryStateDto> completeStory(@AuthenticationPrincipal PlayerPrincipal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).build();
        }
        log.info("Player {} (Team {}) requested STORY COMPLETE", principal.getPlayerId(), principal.getTeamId());
        ActiveStoryStateDto state = cinematicStoryService.completeStory(principal.getTeamId(), principal.getPlayerId());
        return ResponseEntity.ok(state);
    }

    @GetMapping("/history")
    public ResponseEntity<List<String>> getResolvedStories(@AuthenticationPrincipal PlayerPrincipal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).build();
        }
        List<String> keys = cinematicStoryService.getResolvedStoryKeys(principal.getTeamId());
        return ResponseEntity.ok(keys);
    }
}
