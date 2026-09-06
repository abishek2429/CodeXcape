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
            Optional<Hint> hintOpt = hintRepository.findFirstByLevelIdAndIsActiveTrueOrderByDisplayOrderAsc(level.getId());

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

        if (hintNumber > 1 && !hintUsageRepository.existsByTeamIdAndLevelIdAndStageNumberAndHintNumber(
                team.getId(), level.getId(), stageNumber, hintNumber - 1)) {
            throw new ResourceNotFoundException("Request earlier hints before requesting this hint.");
        }

        Hint hint = hintRepository.findByLevelIdAndStageNumberOrderByDisplayOrderAsc(level.getId(), stageNumber).stream()
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
