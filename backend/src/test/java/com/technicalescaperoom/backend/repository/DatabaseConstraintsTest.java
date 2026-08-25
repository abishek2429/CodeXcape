package com.technicalescaperoom.backend.repository;

import com.technicalescaperoom.backend.entity.*;
import com.technicalescaperoom.backend.enums.*;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("dev")
@Transactional
public class DatabaseConstraintsTest {

    @Autowired
    private EventRepository eventRepository;

    @Autowired
    private TeamRepository teamRepository;

    @Autowired
    private PlayerRepository playerRepository;

    @Autowired
    private LevelRepository levelRepository;

    @Autowired
    private QuestionRepository questionRepository;

    @Autowired
    private HintRepository hintRepository;

    @Autowired
    private TeamLevelProgressRepository teamLevelProgressRepository;

    @Test
    @DisplayName("1. Verify seed data loaded correctly from Flyway V12")
    void testSeedDataLoaded() {
        Optional<Event> devEvent = eventRepository.findById(1L);
        assertThat(devEvent).isPresent();
        assertThat(devEvent.get().getName()).contains("College Technical Fest");

        Optional<Team> devTeam = teamRepository.findByTeamCode("TEAM-001");
        assertThat(devTeam).isPresent();

        List<Player> players = playerRepository.findByTeamId(devTeam.get().getId());
        assertThat(players).hasSize(2);

        List<Level> levels = levelRepository.findByIsActiveTrueOrderByLevelNumberAsc();
        assertThat(levels).hasSize(6);

        List<Question> questions = questionRepository.findByLevelId(1L);
        assertThat(questions).hasSize(2);

        Optional<Hint> hintLevel1 = hintRepository.findByLevelIdAndIsActiveTrue(1L);
        assertThat(hintLevel1).isPresent();
    }

    @Test
    @DisplayName("2. A team can belong to an event and have exactly two players")
    void testTeamBelongsToEventAndHasTwoPlayers() {
        Event event = eventRepository.save(Event.builder()
                .name("UnitTest Event")
                .passkeyHash("hash123")
                .status(EventStatus.READY)
                .build());

        Team team = teamRepository.save(Team.builder()
                .event(event)
                .teamCode("TEAM-TEST-99")
                .teamName("Test Squad")
                .status(TeamStatus.REGISTERED)
                .build());

        Player p1 = playerRepository.save(Player.builder()
                .team(team)
                .playerNumber(1)
                .displayName("Player 1 Test")
                .status(PlayerStatus.INACTIVE)
                .build());

        Player p2 = playerRepository.save(Player.builder()
                .team(team)
                .playerNumber(2)
                .displayName("Player 2 Test")
                .status(PlayerStatus.INACTIVE)
                .build());

        assertThat(p1.getId()).isNotNull();
        assertThat(p2.getId()).isNotNull();

        List<Player> teamPlayers = playerRepository.findByTeamId(team.getId());
        assertThat(teamPlayers).hasSize(2);
    }

    @Test
    @DisplayName("3 & 4. A team cannot have two Player 1 records")
    void testPreventDuplicatePlayerOne() {
        Event event = eventRepository.findById(1L).orElseThrow();

        Team team = teamRepository.save(Team.builder()
                .event(event)
                .teamCode("TEAM-DUP-P1")
                .status(TeamStatus.REGISTERED)
                .build());

        playerRepository.save(Player.builder()
                .team(team)
                .playerNumber(1)
                .displayName("Player 1 First")
                .build());

        assertThatThrownBy(() -> {
            playerRepository.saveAndFlush(Player.builder()
                    .team(team)
                    .playerNumber(1)
                    .displayName("Player 1 Duplicate")
                    .build());
        }).isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    @DisplayName("5. A team cannot have two Player 2 records")
    void testPreventDuplicatePlayerTwo() {
        Event event = eventRepository.findById(1L).orElseThrow();

        Team team = teamRepository.save(Team.builder()
                .event(event)
                .teamCode("TEAM-DUP-P2")
                .status(TeamStatus.REGISTERED)
                .build());

        playerRepository.save(Player.builder()
                .team(team)
                .playerNumber(2)
                .displayName("Player 2 First")
                .build());

        assertThatThrownBy(() -> {
            playerRepository.saveAndFlush(Player.builder()
                    .team(team)
                    .playerNumber(2)
                    .displayName("Player 2 Duplicate")
                    .build());
        }).isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    @DisplayName("6. A level contains distinct Player 1 and Player 2 questions")
    void testLevelContainsPlayer1AndPlayer2Questions() {
        Level level1 = levelRepository.findByLevelNumber(1).orElseThrow();

        Optional<Question> q1 = questionRepository.findByLevelIdAndPlayerNumberAndIsActiveTrue(level1.getId(), QuestionPlayer.PLAYER_1);
        Optional<Question> q2 = questionRepository.findByLevelIdAndPlayerNumberAndIsActiveTrue(level1.getId(), QuestionPlayer.PLAYER_2);

        assertThat(q1).isPresent();
        assertThat(q2).isPresent();
        assertThat(q1.get().getPlayerNumber()).isEqualTo(QuestionPlayer.PLAYER_1);
        assertThat(q2.get().getPlayerNumber()).isEqualTo(QuestionPlayer.PLAYER_2);
    }

    @Test
    @DisplayName("7. Prevent duplicate team level progress for same level")
    void testPreventDuplicateTeamLevelProgress() {
        Team devTeam = teamRepository.findByTeamCode("TEAM-001").orElseThrow();
        Level level1 = levelRepository.findByLevelNumber(1).orElseThrow();

        assertThatThrownBy(() -> {
            teamLevelProgressRepository.saveAndFlush(TeamLevelProgress.builder()
                    .team(devTeam)
                    .level(level1)
                    .levelStatus(LevelStatus.IN_PROGRESS)
                    .build());
        }).isInstanceOf(DataIntegrityViolationException.class);
    }
}
