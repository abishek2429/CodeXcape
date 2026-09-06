package com.technicalescaperoom.backend.config.development;

import com.technicalescaperoom.backend.entity.GameSession;
import com.technicalescaperoom.backend.entity.Player;
import com.technicalescaperoom.backend.entity.Team;
import com.technicalescaperoom.backend.enums.PlayerStatus;
import com.technicalescaperoom.backend.enums.SessionStatus;
import com.technicalescaperoom.backend.repository.GameSessionRepository;
import com.technicalescaperoom.backend.repository.PlayerRepository;
import com.technicalescaperoom.backend.repository.TeamRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.Instant;

@Component
public class ReusableTestLoginReset implements CommandLineRunner {

    private static final String TEST_TEAM_CODE = "CODEXCAPE-TEST";
    private static final Logger log = LoggerFactory.getLogger(ReusableTestLoginReset.class);

    private final TeamRepository teamRepository;
    private final GameSessionRepository gameSessionRepository;
    private final PlayerRepository playerRepository;

    public ReusableTestLoginReset(
            TeamRepository teamRepository,
            GameSessionRepository gameSessionRepository,
            PlayerRepository playerRepository
    ) {
        this.teamRepository = teamRepository;
        this.gameSessionRepository = gameSessionRepository;
        this.playerRepository = playerRepository;
    }

    @Override
    @Transactional
    public void run(String... args) {
        teamRepository.findByTeamCode(TEST_TEAM_CODE).ifPresent(this::resetTeamSessions);
    }

    private void resetTeamSessions(Team team) {
        Instant now = Instant.now();
        for (GameSession session : gameSessionRepository.findByTeamId(team.getId())) {
            if (session.getStatus() == SessionStatus.ACTIVE) {
                session.setStatus(SessionStatus.TERMINATED);
                session.setIsConnected(false);
                session.setDisconnectedAt(now);
                gameSessionRepository.save(session);
            }
        }

        for (Player player : playerRepository.findByTeamId(team.getId())) {
            if (player.getStatus() == PlayerStatus.CONNECTED) {
                player.setStatus(PlayerStatus.DISCONNECTED);
                playerRepository.save(player);
            }
        }

        log.info("Reset reusable development test login sessions for team {}", TEST_TEAM_CODE);
    }
}
