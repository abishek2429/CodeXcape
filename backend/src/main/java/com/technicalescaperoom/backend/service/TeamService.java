package com.technicalescaperoom.backend.service;

import com.technicalescaperoom.backend.dto.admin.*;
import com.technicalescaperoom.backend.entity.Event;
import com.technicalescaperoom.backend.entity.Player;
import com.technicalescaperoom.backend.entity.Team;
import com.technicalescaperoom.backend.enums.GameEventType;
import com.technicalescaperoom.backend.enums.PlayerStatus;
import com.technicalescaperoom.backend.enums.TeamStatus;
import com.technicalescaperoom.backend.exception.ResourceNotFoundException;
import com.technicalescaperoom.backend.repository.EventRepository;
import com.technicalescaperoom.backend.repository.PlayerRepository;
import com.technicalescaperoom.backend.repository.TeamRepository;
import com.technicalescaperoom.backend.util.TeamCodeGenerator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TeamService {

    private final EventRepository eventRepository;
    private final TeamRepository teamRepository;
    private final PlayerRepository playerRepository;
    private final TeamCodeGenerator teamCodeGenerator;
    private final AuditService auditService;
    private final GameStateService gameStateService;

    @Transactional
    public TeamDetailResponse createTeam(Long eventId, CreateTeamRequest request) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found with ID: " + eventId));

        if (request.getPlayer1DisplayName() == null || request.getPlayer1DisplayName().isBlank()) {
            throw new IllegalArgumentException("Player 1 display name is required");
        }
        if (request.getPlayer2DisplayName() == null || request.getPlayer2DisplayName().isBlank()) {
            throw new IllegalArgumentException("Player 2 display name is required");
        }

        String teamCode;
        if (request.getCustomTeamCode() != null && !request.getCustomTeamCode().isBlank()) {
            teamCode = request.getCustomTeamCode().trim().toUpperCase();
            if (teamRepository.existsByEventIdAndTeamCode(eventId, teamCode)) {
                throw new IllegalArgumentException("Team code '" + teamCode + "' already exists for this event");
            }
        } else {
            long currentCount = teamRepository.countByEventId(eventId);
            teamCode = teamCodeGenerator.generateUniqueTeamCode(currentCount,
                    code -> teamRepository.existsByEventIdAndTeamCode(eventId, code));
        }

        Team team = Team.builder()
                .event(event)
                .teamCode(teamCode)
                .teamName(request.getTeamName().trim())
                .status(TeamStatus.REGISTERED)
                .build();

        Team savedTeam = teamRepository.save(team);

        Player p1 = Player.builder()
                .team(savedTeam)
                .playerNumber(1)
                .displayName(request.getPlayer1DisplayName().trim())
                .status(PlayerStatus.INACTIVE)
                .build();

        Player p2 = Player.builder()
                .team(savedTeam)
                .playerNumber(2)
                .displayName(request.getPlayer2DisplayName().trim())
                .status(PlayerStatus.INACTIVE)
                .build();

        playerRepository.save(p1);
        playerRepository.save(p2);

        gameStateService.initializeTeamGameState(savedTeam);

        auditService.logEvent(GameEventType.TEAM_CREATED, event, savedTeam, null,
                "{\"teamCode\":\"" + teamCode + "\",\"teamName\":\"" + savedTeam.getTeamName() + "\"}");

        return mapToDetailResponse(savedTeam);
    }

    @Transactional(readOnly = true)
    public TeamDetailResponse getTeamById(Long teamId) {
        Team team = findTeamOrThrow(teamId);
        return mapToDetailResponse(team);
    }

    @Transactional(readOnly = true)
    public List<TeamResponse> getTeamsByEventId(Long eventId) {
        if (!eventRepository.existsById(eventId)) {
            throw new ResourceNotFoundException("Event not found with ID: " + eventId);
        }

        return teamRepository.findByEventId(eventId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public TeamDetailResponse updateTeam(Long teamId, UpdateTeamRequest request) {
        Team team = findTeamOrThrow(teamId);

        team.setTeamName(request.getTeamName().trim());
        team.setStatus(request.getStatus());

        List<Player> players = playerRepository.findByTeamId(teamId);
        for (Player p : players) {
            if (p.getPlayerNumber() == 1 && request.getPlayer1DisplayName() != null) {
                p.setDisplayName(request.getPlayer1DisplayName().trim());
                playerRepository.save(p);
            } else if (p.getPlayerNumber() == 2 && request.getPlayer2DisplayName() != null) {
                p.setDisplayName(request.getPlayer2DisplayName().trim());
                playerRepository.save(p);
            }
        }

        Team updatedTeam = teamRepository.save(team);

        auditService.logEvent(GameEventType.TEAM_UPDATED, updatedTeam.getEvent(), updatedTeam, null,
                "{\"status\":\"" + updatedTeam.getStatus() + "\"}");

        return mapToDetailResponse(updatedTeam);
    }

    @Transactional
    public TeamDetailResponse updateTeamStatus(Long teamId, TeamStatus status) {
        Team team = findTeamOrThrow(teamId);
        team.setStatus(status);

        Team updatedTeam = teamRepository.save(team);

        GameEventType auditType = (status == TeamStatus.ACTIVE)
                ? GameEventType.TEAM_ACTIVATED
                : GameEventType.TEAM_STATUS_CHANGED;

        auditService.logEvent(auditType, updatedTeam.getEvent(), updatedTeam, null,
                "{\"newStatus\":\"" + status + "\"}");

        return mapToDetailResponse(updatedTeam);
    }

    @Transactional
    public void deleteTeam(Long teamId) {
        Team team = findTeamOrThrow(teamId);
        auditService.logEvent(GameEventType.TEAM_DELETED, team.getEvent(), team, null,
                "{\"deletedTeamCode\":\"" + team.getTeamCode() + "\"}");

        playerRepository.deleteByTeamId(teamId);
        teamRepository.delete(team);
    }

    public Team findTeamOrThrow(Long teamId) {
        return teamRepository.findById(teamId)
                .orElseThrow(() -> new ResourceNotFoundException("Team not found with ID: " + teamId));
    }

    private TeamResponse mapToResponse(Team team) {
        List<Player> players = playerRepository.findByTeamId(team.getId());
        String p1Name = players.stream()
                .filter(p -> p.getPlayerNumber() == 1)
                .map(Player::getDisplayName)
                .findFirst().orElse("");
        String p2Name = players.stream()
                .filter(p -> p.getPlayerNumber() == 2)
                .map(Player::getDisplayName)
                .findFirst().orElse("");

        return TeamResponse.builder()
                .id(team.getId())
                .eventId(team.getEvent().getId())
                .teamCode(team.getTeamCode())
                .teamName(team.getTeamName())
                .status(team.getStatus())
                .player1DisplayName(p1Name)
                .player2DisplayName(p2Name)
                .createdAt(team.getCreatedAt())
                .updatedAt(team.getUpdatedAt())
                .build();
    }

    private TeamDetailResponse mapToDetailResponse(Team team) {
        List<Player> players = playerRepository.findByTeamId(team.getId());
        List<PlayerDto> playerDtos = players.stream()
                .map(p -> PlayerDto.builder()
                        .id(p.getId())
                        .playerNumber(p.getPlayerNumber())
                        .displayName(p.getDisplayName())
                        .status(p.getStatus())
                        .createdAt(p.getCreatedAt())
                        .updatedAt(p.getUpdatedAt())
                        .build())
                .collect(Collectors.toList());

        return TeamDetailResponse.builder()
                .id(team.getId())
                .eventId(team.getEvent().getId())
                .eventName(team.getEvent().getName())
                .teamCode(team.getTeamCode())
                .teamName(team.getTeamName())
                .status(team.getStatus())
                .completedAt(team.getCompletedAt())
                .players(playerDtos)
                .createdAt(team.getCreatedAt())
                .updatedAt(team.getUpdatedAt())
                .build();
    }
}
