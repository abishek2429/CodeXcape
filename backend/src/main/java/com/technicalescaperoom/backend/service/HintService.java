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
import java.util.HashMap;
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
    private final GameWebSocketPublisher webSocketPublisher;
    private final ScoringService scoringService;

    @Transactional(readOnly = true)
    public PlayerHintsResponseDto getHintsForPlayer(PlayerPrincipal principal) {
        if (principal == null) {
            throw new ResourceNotFoundException("No authenticated player session found.");
        }

        Team team = teamRepository.findById(principal.getTeamId())
                .orElseThrow(() -> new ResourceNotFoundException("Team not found for ID " + principal.getTeamId()));

        List<HintUsage> usedHints = hintUsageRepository.findByTeamId(team.getId());
        java.util.Set<String> usedHintKeys = usedHints.stream()
                .map(u -> u.getLevel().getLevelNumber() + "_" + u.getStageNumber())
                .collect(Collectors.toSet());

        List<Level> activeLevels = levelRepository.findByIsActiveTrueOrderByLevelNumberAsc();
        List<PlayerHintDto> hintDtos = new ArrayList<>();
        int unlockedCount = 0;

        for (Level level : activeLevels) {
            List<Hint> levelHints = hintRepository.findByLevelIdOrderByDisplayOrderAsc(level.getId());
            Map<Integer, Hint> stageHintMap = new HashMap<>();
            for (Hint h : levelHints) {
                if (Boolean.TRUE.equals(h.getIsActive())) {
                    stageHintMap.putIfAbsent(h.getStageNumber(), h);
                }
            }

            int stagesInLevel = switch (level.getLevelNumber()) {
                case 1, 2, 3 -> 2;
                case 4, 5, 6 -> 3;
                default -> 2;
            };

            for (int stageNum = 1; stageNum <= stagesInLevel; stageNum++) {
                Hint hint = stageHintMap.get(stageNum);
                String key = level.getLevelNumber() + "_" + stageNum;
                boolean isUnlocked = usedHintKeys.contains(key);
                String content = (isUnlocked && hint != null) ? hint.getHintContent() : null;

                if (isUnlocked) {
                    unlockedCount++;
                }

                PlayerHintDto dto = PlayerHintDto.builder()
                        .levelNumber(level.getLevelNumber())
                        .stageNumber(stageNum)
                        .hintNumber(1)
                        .isUnlocked(isUnlocked)
                        .hintContent(content)
                        .build();

                hintDtos.add(dto);
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

        boolean alreadyUsed = hintUsageRepository.existsByTeamIdAndLevelIdAndStageNumberAndHintNumber(
                team.getId(), level.getId(), stageNumber, 1);

        List<Hint> hints = hintRepository.findByLevelIdAndStageNumberOrderByDisplayOrderAsc(level.getId(), stageNumber);
        if (hints.isEmpty()) {
            hints = hintRepository.findByLevelIdOrderByDisplayOrderAsc(level.getId());
        }
        int targetHintNumber = (hintNumber != null && hintNumber > 0) ? hintNumber : 1;
        Hint hint = hints.stream()
                .filter(item -> Boolean.TRUE.equals(item.getIsActive()))
                .filter(item -> item.getDisplayOrder() != null && item.getDisplayOrder().equals(targetHintNumber))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Hint " + targetHintNumber + " not configured for Level " + levelNumber + " Stage " + stageNumber));

        if (!alreadyUsed) {
            try {
                hintUsageRepository.saveAndFlush(HintUsage.builder()
                        .team(team)
                        .level(level)
                        .stageNumber(stageNumber)
                        .hintNumber(1)
                        .build());
                scoringService.recordHintUsage(team.getId(), principal.getPlayerId(), levelNumber, stageNumber, 1);
            } catch (org.springframework.dao.DataIntegrityViolationException e) {
                log.info("Concurrent hint usage detected for team {} level {} stage {}: safely treating as already used",
                        team.getId(), level.getId(), stageNumber);
                alreadyUsed = true;
            }
            webSocketPublisher.notifyHintUnlocked(team.getId(), levelNumber, 1);
        }

        return HintUseResponseDto.builder()
                .levelNumber(levelNumber)
                .stageNumber(stageNumber)
                .hintNumber(1)
                .hintContent(hint.getHintContent())
                .alreadyUsed(alreadyUsed)
                .build();
    }
}
