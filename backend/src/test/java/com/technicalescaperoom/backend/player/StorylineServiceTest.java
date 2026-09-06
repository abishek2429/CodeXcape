package com.technicalescaperoom.backend.player;

import com.technicalescaperoom.backend.config.security.PlayerPrincipal;
import com.technicalescaperoom.backend.dto.player.RecoveryFragmentDto;
import com.technicalescaperoom.backend.dto.player.StorylineDto;
import com.technicalescaperoom.backend.entity.Event;
import com.technicalescaperoom.backend.entity.Player;
import com.technicalescaperoom.backend.entity.Team;
import com.technicalescaperoom.backend.enums.EventStatus;
import com.technicalescaperoom.backend.enums.PlayerStatus;
import com.technicalescaperoom.backend.enums.TeamGameState;
import com.technicalescaperoom.backend.enums.TeamStatus;
import com.technicalescaperoom.backend.repository.EventRepository;
import com.technicalescaperoom.backend.repository.PlayerRepository;
import com.technicalescaperoom.backend.repository.TeamRepository;
import com.technicalescaperoom.backend.service.GameStateService;
import com.technicalescaperoom.backend.service.StorylineService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("dev")
@Transactional
class StorylineServiceTest {

    @Autowired
    private StorylineService storylineService;

    @Autowired
    private GameStateService gameStateService;

    @Autowired
    private TeamRepository teamRepository;

    @Autowired
    private PlayerRepository playerRepository;

    @Autowired
    private EventRepository eventRepository;

    private Team team;
    private Player player1;
    private Player player2;

    @BeforeEach
    void setUp() {
        Event event = eventRepository.findAll().stream().findFirst()
                .orElseGet(() -> eventRepository.save(Event.builder()
                        .name("Storyline Test Event")
                        .status(EventStatus.READY)
                        .passkeyHash("$2a$10$7vB9f1p2q3r4s5t6u7v8w9x0y1z2a3b4c5d6e7f8g9h0i1j2k3l4m")
                        .build()));

        String suffix = System.currentTimeMillis() + "-" + (int) (Math.random() * 10000);

        team = teamRepository.save(Team.builder()
                .event(event)
                .teamCode("STORY-" + suffix)
                .teamName("Story Testers " + suffix)
                .status(TeamStatus.REGISTERED)
                .gameState(TeamGameState.NOT_STARTED)
                .build());

        player1 = playerRepository.save(Player.builder()
                .team(team)
                .playerNumber(1)
                .displayName("Investigator 1")
                .status(PlayerStatus.CONNECTED)
                .build());

        player2 = playerRepository.save(Player.builder()
                .team(team)
                .playerNumber(2)
                .displayName("Investigator 2")
                .status(PlayerStatus.CONNECTED)
                .build());

        gameStateService.initializeTeamGameState(team);
    }

    private PlayerPrincipal principalFor(Player p) {
        return PlayerPrincipal.builder()
                .playerId(p.getId())
                .teamId(team.getId())
                .eventId(team.getEvent().getId())
                .playerNumber(p.getPlayerNumber())
                .displayName(p.getDisplayName())
                .teamCode(team.getTeamCode())
                .teamName(team.getTeamName())
                .build();
    }

    @Test
    @DisplayName("1. Level 1 Initial State: Network Integrity 87%, Theme 'THE DISCREPANCY', Objective '01 — LOCATE NODE 06', Fragments encrypted")
    void testLevel1InitialState() {
        StorylineDto storyP1 = storylineService.getStorylineForPlayer(principalFor(player1));

        assertEquals(1, storyP1.getCurrentLevel());
        assertEquals("THE DISCREPANCY", storyP1.getThemeTitle());
        assertEquals(87, storyP1.getNetworkIntegrityPercent());
        assertEquals("01 — LOCATE NODE 06", storyP1.getActiveObjective());
        assertTrue(storyP1.getPlayerPerspectiveLog().contains("NODE 01 INGRESS"));
        assertTrue(storyP1.getEnvironmentalAlert().contains("UNAUTHORIZED COMMUNICATION"));

        List<RecoveryFragmentDto> fragments = storyP1.getFragments();
        assertEquals(6, fragments.size());
        assertEquals("ENCRYPTED", fragments.get(0).getStatus());
        assertEquals("[ENCRYPTED // COMPLETE LEVEL 1 TO DECRYPT]", fragments.get(0).getNarrativeContent());
    }

    @Test
    @DisplayName("2. Two-Player Perspective Asymmetry: P1 gets Ingress perspective while P2 gets Topology perspective")
    void testTwoPlayerPerspectiveAsymmetry() {
        StorylineDto storyP1 = storylineService.getStorylineForPlayer(principalFor(player1));
        StorylineDto storyP2 = storylineService.getStorylineForPlayer(principalFor(player2));

        assertNotEquals(storyP1.getPlayerPerspectiveLog(), storyP2.getPlayerPerspectiveLog());
        assertTrue(storyP1.getPlayerPerspectiveLog().contains("NODE 01 INGRESS"));
        assertTrue(storyP2.getPlayerPerspectiveLog().contains("NODE 02 TOPOLOGY"));
    }

    @Test
    @DisplayName("3. Progressive Disclosure: Completing Level 1 unlocks Fragment 1 (SYSTEM TRACE: K-17) and advances to Level 2 (74%)")
    void testLevel1CompletionFragmentUnlock() {
        gameStateService.completeLevel(team.getId(), 1);

        StorylineDto story = storylineService.getStorylineForPlayer(principalFor(player1));
        assertEquals(2, story.getCurrentLevel());
        assertEquals("THE HIDDEN PATH", story.getThemeTitle());
        assertEquals(74, story.getNetworkIntegrityPercent());

        List<RecoveryFragmentDto> fragments = story.getFragments();
        assertEquals("UNLOCKED", fragments.get(0).getStatus());
        assertTrue(fragments.get(0).getNarrativeContent().contains("K-17"));
        assertTrue(fragments.get(0).getNarrativeContent().contains("Someone removed this node from the map."));

        assertEquals("ENCRYPTED", fragments.get(1).getStatus());
        assertEquals("ENCRYPTED", fragments.get(2).getStatus());
    }

    @Test
    @DisplayName("4. Mid-Game Revelations: Level 4 unlocks PROJECT SIX, Level 5 unlocks FAILSAFE PURPOSE")
    void testProjectSixAndFailsafeRevelations() {
        for (int i = 1; i <= 4; i++) {
            gameStateService.completeLevel(team.getId(), i);
        }

        StorylineDto storyL5 = storylineService.getStorylineForPlayer(principalFor(player1));
        assertEquals(5, storyL5.getCurrentLevel());
        assertEquals("THE CREATOR", storyL5.getThemeTitle());
        assertEquals(23, storyL5.getNetworkIntegrityPercent());

        List<RecoveryFragmentDto> fragments = storyL5.getFragments();
        assertEquals("UNLOCKED", fragments.get(3).getStatus());
        assertEquals("PROJECT SIX", fragments.get(3).getTitle());
        assertTrue(fragments.get(3).getNarrativeContent().contains("PROJECT SIX WAS CREATED INSIDE THE NETWORK"));

        // Complete Level 5
        gameStateService.completeLevel(team.getId(), 5);
        StorylineDto storyL6 = storylineService.getStorylineForPlayer(principalFor(player1));
        assertEquals(6, storyL6.getCurrentLevel());
        assertEquals(9, storyL6.getNetworkIntegrityPercent());

        List<RecoveryFragmentDto> fragmentsL6 = storyL6.getFragments();
        assertEquals("UNLOCKED", fragmentsL6.get(4).getStatus());
        assertTrue(fragmentsL6.get(4).getNarrativeContent().contains("NODE 06 WAS DESIGNED TO OPERATE IF THE PRIMARY NETWORK FAILED"));
    }

    @Test
    @DisplayName("5. Final Completion State: Network Integrity 100%, Fragment 6 unlocked, Final Narrative delivered")
    void testFinalCompletionState() {
        for (int i = 1; i <= 6; i++) {
            gameStateService.completeLevel(team.getId(), i);
        }

        team.setGameState(TeamGameState.COMPLETED);
        teamRepository.save(team);

        StorylineDto story = storylineService.getStorylineForPlayer(principalFor(player1));
        assertEquals(100, story.getNetworkIntegrityPercent());

        List<RecoveryFragmentDto> fragments = story.getFragments();
        assertEquals("UNLOCKED", fragments.get(5).getStatus());
        assertTrue(fragments.get(5).getNarrativeContent().contains("ACCESS GRANTED"));
        assertTrue(fragments.get(5).getNarrativeContent().contains("NODE 01 ... RESTORED"));
        assertTrue(fragments.get(5).getNarrativeContent().contains("YOU FOUND ME."));
        assertTrue(fragments.get(5).getNarrativeContent().contains("WHAT WAS HIDDEN IN PLAIN SIGHT."));
    }

    @Test
    @DisplayName("6. Security: The raw passkey (849201) is NEVER present in any storyline text or fragment DTO")
    void testSecurityNoPasskeyLeak() {
        for (int i = 1; i <= 6; i++) {
            gameStateService.completeLevel(team.getId(), i);
        }
        team.setGameState(TeamGameState.COMPLETED);
        teamRepository.save(team);

        StorylineDto story = storylineService.getStorylineForPlayer(principalFor(player1));
        assertFalse(story.toString().contains("849201"), "Storyline DTO must never leak the raw passkey 849201!");
        for (RecoveryFragmentDto frag : story.getFragments()) {
            assertFalse(frag.getNarrativeContent().contains("849201"));
            assertFalse(frag.getTechnicalArtifact().contains("849201"));
        }
    }
}
