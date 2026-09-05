package com.technicalescaperoom.backend.player;

import com.technicalescaperoom.backend.config.security.PlayerPrincipal;
import com.technicalescaperoom.backend.dto.player.AnswerSubmissionRequest;
import com.technicalescaperoom.backend.dto.player.AnswerSubmissionResponseDto;
import com.technicalescaperoom.backend.dto.player.PlayerQuestionDto;
import com.technicalescaperoom.backend.entity.Event;
import com.technicalescaperoom.backend.entity.Level;
import com.technicalescaperoom.backend.entity.Player;
import com.technicalescaperoom.backend.entity.Question;
import com.technicalescaperoom.backend.entity.Team;
import com.technicalescaperoom.backend.entity.TeamLevelProgress;
import com.technicalescaperoom.backend.entity.TeamStageProgress;
import com.technicalescaperoom.backend.enums.AnswerType;
import com.technicalescaperoom.backend.enums.EventStatus;
import com.technicalescaperoom.backend.enums.LevelStatus;
import com.technicalescaperoom.backend.enums.PlayerStatus;
import com.technicalescaperoom.backend.enums.QuestionPlayer;
import com.technicalescaperoom.backend.enums.TeamStatus;
import com.technicalescaperoom.backend.repository.EventRepository;
import com.technicalescaperoom.backend.repository.LevelRepository;
import com.technicalescaperoom.backend.repository.PlayerRepository;
import com.technicalescaperoom.backend.repository.QuestionRepository;
import com.technicalescaperoom.backend.repository.TeamLevelProgressRepository;
import com.technicalescaperoom.backend.repository.TeamStageProgressRepository;
import com.technicalescaperoom.backend.repository.TeamRepository;
import com.technicalescaperoom.backend.service.QuestionAnswerService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("dev")
@Transactional
class CooperativeStageProgressionTest {

    @Autowired private EventRepository eventRepository;
    @Autowired private TeamRepository teamRepository;
    @Autowired private PlayerRepository playerRepository;
    @Autowired private LevelRepository levelRepository;
    @Autowired private QuestionRepository questionRepository;
    @Autowired private TeamLevelProgressRepository progressRepository;
    @Autowired private TeamStageProgressRepository stageProgressRepository;
    @Autowired private QuestionAnswerService questionAnswerService;

    private PlayerPrincipal playerOne;
    private PlayerPrincipal playerTwo;

    @BeforeEach
    void setUp() {
        Event event = eventRepository.save(Event.builder()
                .name("Stage Test Event")
                .status(EventStatus.READY)
                .passkeyHash("unused")
                .build());
        Team team = teamRepository.save(Team.builder()
                .event(event)
                .teamCode("STAGE-TEST")
                .teamName("Stage Test")
                .status(TeamStatus.REGISTERED)
                .build());
        Player p1 = playerRepository.save(Player.builder().team(team).playerNumber(1).displayName("P1").status(PlayerStatus.INACTIVE).build());
        Player p2 = playerRepository.save(Player.builder().team(team).playerNumber(2).displayName("P2").status(PlayerStatus.INACTIVE).build());
        Level level = levelRepository.save(Level.builder().levelNumber(1).name("LEVEL 1").isActive(true).build());

        for (int stage = 1; stage <= 2; stage++) {
            questionRepository.save(question(level, stage, QuestionPlayer.PLAYER_1));
            questionRepository.save(question(level, stage, QuestionPlayer.PLAYER_2));
        }
        progressRepository.save(TeamLevelProgress.builder().team(team).level(level).levelStatus(LevelStatus.AVAILABLE).build());
        for (int stage = 1; stage <= 2; stage++) {
            stageProgressRepository.save(TeamStageProgress.builder().team(team).level(level).stageNumber(stage).discoveryKey("L1-S" + stage).build());
        }

        playerOne = principal(team, p1);
        playerTwo = principal(team, p2);
    }

    @Test
    void stageRequiresBothPlayersBeforeNextStageUnlocks() {
        PlayerQuestionDto initial = questionAnswerService.getCurrentQuestionForPlayer(playerOne);
        assertEquals(1, initial.getStageNumber());
        assertEquals(2, initial.getTotalStages());

        AnswerSubmissionResponseDto p1Result = questionAnswerService.submitAnswer(playerOne, answer("DISCOVERY-1"));
        assertTrue(p1Result.getCorrect());
        assertFalse(p1Result.getStageCompleted());
        assertEquals(1, questionAnswerService.getCurrentQuestionForPlayer(playerOne).getStageNumber());

        AnswerSubmissionResponseDto p2Result = questionAnswerService.submitAnswer(playerTwo, answer("DISCOVERY-1"));
        assertTrue(p2Result.getCorrect());
        assertTrue(p2Result.getStageCompleted());
        assertEquals(2, questionAnswerService.getCurrentQuestionForPlayer(playerOne).getStageNumber());
    }

    private Question question(Level level, int stage, QuestionPlayer player) {
        return Question.builder()
                .level(level)
                .stageNumber(stage)
                .playerNumber(player)
                .evidence("Private stage " + stage + " artifact for " + player)
                .instructions("Compare with your teammate and submit the shared discovery.")
                .puzzleContext("STAGE " + stage)
                .expectedAnswerHash("DISCOVERY-" + stage)
                .answerType(AnswerType.TEXT)
                .isActive(true)
                .build();
    }

    private PlayerPrincipal principal(Team team, Player player) {
        return PlayerPrincipal.builder()
                .playerId(player.getId())
                .teamId(team.getId())
                .eventId(team.getEvent().getId())
                .playerNumber(player.getPlayerNumber())
                .teamCode(team.getTeamCode())
                .teamName(team.getTeamName())
                .displayName(player.getDisplayName())
                .sessionToken("test-token-" + player.getPlayerNumber())
                .build();
    }

    private AnswerSubmissionRequest answer(String value) {
        return AnswerSubmissionRequest.builder().answer(value).levelNumber(1).build();
    }
}
