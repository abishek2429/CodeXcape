package com.technicalescaperoom.backend.controller.admin;

import com.technicalescaperoom.backend.dto.player.StorylineDto;
import com.technicalescaperoom.backend.service.StorylineService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/story")
@RequiredArgsConstructor
public class AdminStoryController {

    private final StorylineService storylineService;

    @GetMapping("/progress/{teamId}")
    public ResponseEntity<StorylineDto> getTeamStoryProgress(@PathVariable Long teamId) {
        StorylineDto storyline = storylineService.getStorylineForTeamAdmin(teamId);
        return ResponseEntity.ok(storyline);
    }
}
