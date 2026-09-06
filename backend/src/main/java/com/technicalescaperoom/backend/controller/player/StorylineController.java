package com.technicalescaperoom.backend.controller.player;

import com.technicalescaperoom.backend.config.security.PlayerPrincipal;
import com.technicalescaperoom.backend.dto.player.StorylineDto;
import com.technicalescaperoom.backend.service.StorylineService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/player/game")
@RequiredArgsConstructor
public class StorylineController {

    private final StorylineService storylineService;

    @GetMapping("/story")
    public ResponseEntity<StorylineDto> getStoryline(@AuthenticationPrincipal PlayerPrincipal principal) {
        StorylineDto storyline = storylineService.getStorylineForPlayer(principal);
        return ResponseEntity.ok(storyline);
    }
}
