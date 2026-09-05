package com.technicalescaperoom.backend.service;

import com.technicalescaperoom.backend.config.security.PlayerPrincipal;
import com.technicalescaperoom.backend.dto.player.PlayerHintDto;
import com.technicalescaperoom.backend.dto.player.PlayerHintsResponseDto;
import com.technicalescaperoom.backend.dto.player.HintUseResponseDto;
import com.technicalescaperoom.backend.entity.Hint;
import com.technicalescaperoom.backend.entity.HintUsage;
import com.technicalescaperoom.backend.entity.Level;
import com.technicalescaperoom.backend.entity.Team;
import com.technicalescaperoom.backend.entity.TeamLevelProgress;
import com.technicalescaperoom.backend.entity.TeamStageProgress;
import com.technicalescaperoom.backend.enums.LevelStatus;
import com.technicalescaperoom.backend.exception.ResourceNotFoundException;
import com.technicalescaperoom.backend.repository.HintRepository;
import com.technicalescaperoom.backend.repository.LevelRepository;
import com.technicalescaperoom.backend.repository.TeamLevelProgressRepository;
import com.technicalescaperoom.backend.repository.TeamRepository;
import com.technicalescaperoom.backend.repository.HintUsageRepository;
import com.technicalescaperoom.backend.repository.TeamStageProgressRepository;
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
    private final HintUsageRepository hintUsageRepository;
    private final TeamStageProgressRepository teamStageProgressRepository;

    @Transactional(readOnly = true)
    public PlayerHintsResponseDto getHintsForPlayer(PlayerPrincipal principal) {
        if (principal == null) {
            throw new ResourceNotFoundException("No authenticated player session found.");
        }

        Team team = teamRepository.findById(principal.getTeamId())
                .orElseThrow(() -> new ResourceNotFoundException("Team not found for ID " + principal.getTeamId()));

        List<TeamLevelProgress> progressList = teamLevelProgressRepository.findByTeamIdOrderByLevelIdAsc(team.getId());
        Map<Long, TeamLevelProgress> progressByLevel = progressList.stream()
            .collect(Collectors.toMap(p -> p.getLevel().getId(), p -> p));

        List<Level> activeLevels = levelRepository.findByIsActiveTrueOrderByLevelNumberAsc();
        List<PlayerHintDto> hintDtos = new ArrayList<>();
        int unlockedCount = 0;

        for (Level level : activeLevels) {
            TeamLevelProgress progress = progressByLevel.get(level.getId());
            boolean isCurrentLevel = progress != null
                    && (progress.getLevelStatus() == LevelStatus.AVAILABLE || progress.getLevelStatus() == LevelStatus.IN_PROGRESS);
                List<Hint> levelHints = hintRepository.findByLevelIdOrderByDisplayOrderAsc(level.getId());
                if (levelHints.isEmpty()) {
                hintDtos.add(PlayerHintDto.builder()
                    .levelNumber(level.getLevelNumber())
                    .hintNumber(1)
                    .isUnlocked(false)
                    .hintContent(null)
                    .build());
                continue;
                }

                for (Hint hint : levelHints) {
                boolean available = isCurrentLevel && Boolean.TRUE.equals(hint.getIsActive())
                    && hint.getHintContent() != null && !hint.getHintContent().isBlank();
                if (available) unlockedCount++;
                hintDtos.add(PlayerHintDto.builder()
                    .levelNumber(level.getLevelNumber())
                    .hintNumber(hint.getDisplayOrder())
                    .isUnlocked(available)
                    .hintContent(available ? hint.getHintContent() : null)
                    .build());
                }
        }

        return PlayerHintsResponseDto.builder()
                .hints(hintDtos)
                .unlockedCount(unlockedCount)
                .totalCount(hintDtos.size())
                .build();
    }

        @Transactional
        public HintUseResponseDto useHint(PlayerPrincipal principal, Integer levelNumber, Integer stageNumber, Integer hintNumber) {
        if (principal == null) throw new ResourceNotFoundException("No authenticated player session found.");
        Team team = teamRepository.findById(principal.getTeamId())
            .orElseThrow(() -> new ResourceNotFoundException("Team not found."));
        Level level = levelRepository.findByLevelNumber(levelNumber)
            .orElseThrow(() -> new ResourceNotFoundException("Level not found."));
        TeamStageProgress stage = teamStageProgressRepository.findByTeamIdAndLevelIdAndStageNumber(
                team.getId(), level.getId(), stageNumber)
            .orElseThrow(() -> new ResourceNotFoundException("Stage is not available."));
        boolean current = teamStageProgressRepository.findByTeamIdAndLevelIdOrderByStageNumberAsc(team.getId(), level.getId())
            .stream().filter(item -> !Boolean.TRUE.equals(item.getPlayer1Completed()) || !Boolean.TRUE.equals(item.getPlayer2Completed()))
            .findFirst().map(item -> item.getStageNumber().equals(stageNumber)).orElse(false);
        if (!current) throw new ResourceNotFoundException("Stage is not currently available.");
        if (hintNumber < 1 || hintNumber > 3) throw new IllegalArgumentException("Hint number must be between 1 and 3.");

        Hint hint = hintRepository.findByLevelIdOrderByDisplayOrderAsc(level.getId()).stream()
            .filter(item -> item.getDisplayOrder().equals(hintNumber) && Boolean.TRUE.equals(item.getIsActive()))
            .findFirst().orElseThrow(() -> new ResourceNotFoundException("Hint not configured."));
        boolean alreadyUsed = hintUsageRepository.existsByTeamIdAndLevelIdAndStageNumberAndHintNumber(
            team.getId(), level.getId(), stageNumber, hintNumber);
        if (!alreadyUsed) {
            hintUsageRepository.save(HintUsage.builder().team(team).level(level).stageNumber(stageNumber).hintNumber(hintNumber).build());
        }
        return HintUseResponseDto.builder().levelNumber(levelNumber).stageNumber(stageNumber)
            .hintNumber(hintNumber).hintContent(hint.getHintContent()).alreadyUsed(alreadyUsed).build();
        }
}
