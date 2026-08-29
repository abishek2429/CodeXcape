package com.technicalescaperoom.backend.service;

import com.technicalescaperoom.backend.config.security.PlayerPrincipal;
import com.technicalescaperoom.backend.dto.player.PlayerHintDto;
import com.technicalescaperoom.backend.dto.player.PlayerHintsResponseDto;
import com.technicalescaperoom.backend.entity.Hint;
import com.technicalescaperoom.backend.entity.Level;
import com.technicalescaperoom.backend.entity.Team;
import com.technicalescaperoom.backend.entity.TeamLevelProgress;
import com.technicalescaperoom.backend.enums.LevelStatus;
import com.technicalescaperoom.backend.exception.ResourceNotFoundException;
import com.technicalescaperoom.backend.repository.HintRepository;
import com.technicalescaperoom.backend.repository.LevelRepository;
import com.technicalescaperoom.backend.repository.TeamLevelProgressRepository;
import com.technicalescaperoom.backend.repository.TeamRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class HintService {

    private final TeamRepository teamRepository;
    private final TeamLevelProgressRepository teamLevelProgressRepository;
    private final LevelRepository levelRepository;
    private final HintRepository hintRepository;

    @Transactional(readOnly = true)
    public PlayerHintsResponseDto getHintsForPlayer(PlayerPrincipal principal) {
        if (principal == null) {
            throw new ResourceNotFoundException("No authenticated player session found.");
        }

        Team team = teamRepository.findById(principal.getTeamId())
                .orElseThrow(() -> new ResourceNotFoundException("Team not found for ID " + principal.getTeamId()));

        List<TeamLevelProgress> progressList = teamLevelProgressRepository.findByTeamIdOrderByLevelIdAsc(team.getId());
        Map<Long, Boolean> levelCompletedMap = progressList.stream()
                .collect(Collectors.toMap(
                        p -> p.getLevel().getId(),
                        p -> p.getLevelStatus() == LevelStatus.COMPLETED
                ));

        List<Level> activeLevels = levelRepository.findByIsActiveTrueOrderByLevelNumberAsc();
        List<PlayerHintDto> hintDtos = new ArrayList<>();
        int unlockedCount = 0;

        for (Level level : activeLevels) {
            boolean isUnlocked = Boolean.TRUE.equals(levelCompletedMap.get(level.getId()));
            Optional<Hint> hintOpt = hintRepository.findByLevelIdAndIsActiveTrue(level.getId());

            String content = isUnlocked ? hintOpt.map(Hint::getHintContent).orElse(null) : null;
            if (isUnlocked) {
                unlockedCount++;
            }

            PlayerHintDto dto = PlayerHintDto.builder()
                    .levelNumber(level.getLevelNumber())
                    .hintNumber(level.getLevelNumber())
                    .isUnlocked(isUnlocked)
                    .hintContent(content)
                    .build();

            hintDtos.add(dto);
        }

        return PlayerHintsResponseDto.builder()
                .hints(hintDtos)
                .unlockedCount(unlockedCount)
                .totalCount(activeLevels.size())
                .build();
    }
}
