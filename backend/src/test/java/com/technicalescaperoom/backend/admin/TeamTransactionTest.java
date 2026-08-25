package com.technicalescaperoom.backend.admin;

import com.technicalescaperoom.backend.dto.admin.CreateTeamRequest;
import com.technicalescaperoom.backend.repository.TeamRepository;
import com.technicalescaperoom.backend.service.TeamService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("dev")
@Transactional
public class TeamTransactionTest {

    @Autowired
    private TeamService teamService;

    @Autowired
    private TeamRepository teamRepository;

    @Test
    @DisplayName("Transaction rolls back team creation atomically if player creation throws an exception")
    void testAtomicRollbackOnPlayerFailure() {
        long initialTeamCount = teamRepository.count();

        CreateTeamRequest invalidRequest = CreateTeamRequest.builder()
                .teamName("Atomic Fail Squad")
                .player1DisplayName("Player 1")
                .player2DisplayName(null) // Cause exception during validation/creation
                .build();

        assertThatThrownBy(() -> teamService.createTeam(1L, invalidRequest))
                .isInstanceOf(IllegalArgumentException.class);

        long finalTeamCount = teamRepository.count();
        assertThat(finalTeamCount).isEqualTo(initialTeamCount);
    }
}
