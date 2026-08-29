package com.technicalescaperoom.backend.service.admin;

import com.technicalescaperoom.backend.config.security.AdminPrincipal;
import com.technicalescaperoom.backend.entity.Team;
import com.technicalescaperoom.backend.entity.TeamLevelProgress;
import com.technicalescaperoom.backend.enums.LevelStatus;
import com.technicalescaperoom.backend.enums.TeamGameState;
import com.technicalescaperoom.backend.exception.ResourceNotFoundException;
import com.technicalescaperoom.backend.repository.AnswerAttemptRepository;
import com.technicalescaperoom.backend.repository.TeamLevelProgressRepository;
import com.technicalescaperoom.backend.repository.TeamRepository;
import com.technicalescaperoom.backend.service.GameWebSocketPublisher;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminTeamResetService {

    private final TeamRepository teamRepository;
    private final TeamLevelProgressRepository teamLevelProgressRepository;
    private final AnswerAttemptRepository answerAttemptRepository;
    private final GameWebSocketPublisher webSocketPublisher;
    private final AdminAuditService adminAuditService;

    @Transactional
    public void resetTeamProgress(AdminPrincipal principal, Long teamId) {
        Team team = teamRepository.findForUpdateById(teamId)
                .orElseThrow(() -> new ResourceNotFoundException("Team not found for ID " + teamId));

        List<TeamLevelProgress> progressList = teamLevelProgressRepository.findByTeamIdOrderByLevelIdAsc(team.getId());

        for (TeamLevelProgress progress : progressList) {
            int levelNum = progress.getLevel().getLevelNumber();
            if (levelNum == 1) {
                progress.setLevelStatus(LevelStatus.AVAILABLE);
                progress.setStartedAt(Instant.now());
            } else {
                progress.setLevelStatus(LevelStatus.LOCKED);
                progress.setStartedAt(null);
            }
            progress.setPlayer1Completed(false);
            progress.setPlayer2Completed(false);
            progress.setCompletedAt(null);
        }

        teamLevelProgressRepository.saveAll(progressList);

        // Delete answer attempts for team
        answerAttemptRepository.deleteByTeamId(team.getId());

        // Reset team state
        team.setGameState(TeamGameState.IN_PROGRESS);
        team.setCompletedAt(null);
        teamRepository.saveAndFlush(team);

        adminAuditService.logAction(
                principal,
                "RESET_TEAM",
                "Team " + team.getTeamCode() + " (#" + team.getId() + ")",
                "Reset level progress, answer attempts, and completion state"
        );

        log.info("Admin {} reset Team {} (#{}) progress to Level 1.", principal != null ? principal.getUsername() : "SYSTEM", team.getTeamCode(), team.getId());

        // Broadcast WebSocket update
        webSocketPublisher.notifyEventStatusChange(team.getId(), "Team progress was reset by the organizer.");
    }
}
