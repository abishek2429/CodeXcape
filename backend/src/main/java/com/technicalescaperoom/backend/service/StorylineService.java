package com.technicalescaperoom.backend.service;

import com.technicalescaperoom.backend.config.security.PlayerPrincipal;
import com.technicalescaperoom.backend.dto.player.RecoveryFragmentDto;
import com.technicalescaperoom.backend.dto.player.StorylineDto;
import com.technicalescaperoom.backend.entity.Level;
import com.technicalescaperoom.backend.entity.Player;
import com.technicalescaperoom.backend.entity.Team;
import com.technicalescaperoom.backend.entity.TeamLevelProgress;
import com.technicalescaperoom.backend.enums.LevelStatus;
import com.technicalescaperoom.backend.enums.TeamGameState;
import com.technicalescaperoom.backend.exception.ResourceNotFoundException;
import com.technicalescaperoom.backend.repository.PlayerRepository;
import com.technicalescaperoom.backend.repository.TeamLevelProgressRepository;
import com.technicalescaperoom.backend.repository.TeamRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class StorylineService {

    private final TeamRepository teamRepository;
    private final PlayerRepository playerRepository;
    private final TeamLevelProgressRepository teamLevelProgressRepository;

    @Transactional(readOnly = true)
    public StorylineDto getStorylineForPlayer(PlayerPrincipal principal) {
        if (principal == null) {
            throw new ResourceNotFoundException("No authenticated player session found.");
        }

        Team team = teamRepository.findById(principal.getTeamId())
                .orElseThrow(() -> new ResourceNotFoundException("Team not found."));

        Player player = playerRepository.findById(principal.getPlayerId())
                .orElseThrow(() -> new ResourceNotFoundException("Player not found."));

        return buildStorylineState(team, player.getPlayerNumber());
    }

    @Transactional(readOnly = true)
    public StorylineDto getStorylineForTeamAdmin(Long teamId) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new ResourceNotFoundException("Team not found."));

        return buildStorylineState(team, 1);
    }

    private StorylineDto buildStorylineState(Team team, int playerNumber) {
        List<TeamLevelProgress> progressList = teamLevelProgressRepository.findByTeamIdOrderByLevelIdAsc(team.getId());

        int currentLevel = 1;
        int completedLevels = 0;

        for (TeamLevelProgress p : progressList) {
            if (p.getLevelStatus() == LevelStatus.COMPLETED) {
                completedLevels++;
            }
        }

        Optional<TeamLevelProgress> activeProgress = progressList.stream()
                .filter(p -> p.getLevelStatus() == LevelStatus.AVAILABLE || p.getLevelStatus() == LevelStatus.IN_PROGRESS)
                .findFirst();

        if (activeProgress.isPresent()) {
            currentLevel = activeProgress.get().getLevel().getLevelNumber();
        } else if (team.getGameState() == TeamGameState.FINAL_PASSKEY || team.getGameState() == TeamGameState.COMPLETED) {
            currentLevel = 6;
        }

        boolean isCompleted = team.getGameState() == TeamGameState.COMPLETED;
        boolean isFinalPasskey = team.getGameState() == TeamGameState.FINAL_PASSKEY;

        int integrityPercent;
        if (isCompleted) {
            integrityPercent = 100;
        } else {
            switch (currentLevel) {
                case 1: integrityPercent = 87; break;
                case 2: integrityPercent = 74; break;
                case 3: integrityPercent = 58; break;
                case 4: integrityPercent = 42; break;
                case 5: integrityPercent = 23; break;
                case 6: integrityPercent = isFinalPasskey ? 5 : 9; break;
                default: integrityPercent = 87; break;
            }
        }

        String themeTitle;
        String activeObjective;
        String alert;
        String playerPerspective;

        switch (currentLevel) {
            case 1:
                themeTitle = "THE DISCREPANCY";
                activeObjective = "01 — LOCATE NODE 06";
                alert = "UNAUTHORIZED COMMUNICATION DETECTED // SOURCE: UNMAPPED RELAY";
                playerPerspective = (playerNumber == 1)
                        ? "[NODE 01 INGRESS] Asymmetric log stream collision observed. Trace abnormal relay state transitions."
                        : "[NODE 02 TOPOLOGY] Channel K possesses no official registration in Node 01-05 map. Decouple decoys.";
                break;
            case 2:
                themeTitle = "THE HIDDEN PATH";
                activeObjective = "02 — TRACE ITS ORIGIN";
                alert = "OFFICIAL ROUTE INVALID // ALTERNATE DATA PATH DETECTED";
                playerPerspective = (playerNumber == 1)
                        ? "[NODE 01 INGRESS] Fragmented bytes recovered bypassing official data gateway. Assembly required."
                        : "[NODE 02 TOPOLOGY] Boundary order confirms alternate hidden route communicating with NODE 06.";
                break;
            case 3:
                themeTitle = "THE GHOST SIGNAL";
                activeObjective = "02 — TRACE ITS ORIGIN";
                alert = "INTERMITTENT EMISSION DETECTED // NODE 06 ACTIVE UNDER SPECIFIC TRIGGERS";
                playerPerspective = (playerNumber == 1)
                        ? "[NODE 01 INGRESS] Pulse origin isolated at Node A through router B. Dropped packets contain decoys."
                        : "[NODE 02 TOPOLOGY] Intermittent forwarding path C->E isolates verified transmission trigger.";
                break;
            case 4:
                themeTitle = "THE ARCHIVE";
                activeObjective = "03 — DETERMINE ITS PURPOSE";
                alert = "PROJECT SIX DISCOVERED // CLASSIFIED INTERNAL REPOSITORY ACCESSED";
                playerPerspective = (playerNumber == 1)
                        ? "[NODE 01 INGRESS] Cipher behavior matches internal architecture specification archives."
                        : "[NODE 02 TOPOLOGY] Decryption reveals Project SIX originated INSIDE the network, not an external breach.";
                break;
            case 5:
                themeTitle = "THE CREATOR";
                activeObjective = "03 — DETERMINE ITS PURPOSE";
                alert = "PRIMARY ARCHITECTURE FAILING // ISOLATED FAILSAFE IDENTIFIED";
                playerPerspective = (playerNumber == 1)
                        ? "[NODE 01 INGRESS] Forensic chain confirms Node 06 is independent of Nodes 01-05 control authority."
                        : "[NODE 02 TOPOLOGY] Architecture recovered: Node 06 was built to preserve system if primary network collapsed.";
                break;
            case 6:
            default:
                themeTitle = "THE TRUTH";
                activeObjective = "04 — RECOVER THE FINAL ACCESS SEQUENCE";
                alert = isCompleted
                        ? "SYSTEM RESTORED // ALL PRIMARY NODES OPERATIONAL // INTEGRITY 100%"
                        : "PRIMARY NODES CRITICAL // EMERGENCY OVERRIDE PROTOCOL ENGAGED";
                playerPerspective = (playerNumber == 1)
                        ? "[NODE 01 INGRESS] Odd parity dependency shards ready for master core protocol synthesis."
                        : "[NODE 02 TOPOLOGY] Even parity dependency shards aligned. Dual-operator authorization required.";
                break;
        }

        List<RecoveryFragmentDto> fragments = buildRecoveryFragments(completedLevels, isCompleted);

        String latestUnlockNarrative = null;
        if (completedLevels > 0 && completedLevels <= 5) {
            latestUnlockNarrative = fragments.get(completedLevels - 1).getNarrativeContent();
        } else if (isCompleted) {
            latestUnlockNarrative = "ACCESS GRANTED. SYSTEM RECOVERY INITIATED. ALL NODES RESTORED.";
        }

        return StorylineDto.builder()
                .currentLevel(currentLevel)
                .themeTitle(themeTitle)
                .networkIntegrityPercent(integrityPercent)
                .activeObjective(activeObjective)
                .playerPerspectiveLog(playerPerspective)
                .environmentalAlert(alert)
                .latestUnlockNarrative(latestUnlockNarrative)
                .fragments(fragments)
                .build();
    }

    private List<RecoveryFragmentDto> buildRecoveryFragments(int completedLevels, boolean isCompleted) {
        List<RecoveryFragmentDto> fragments = new ArrayList<>();

        // Fragment 01 - Level 1
        boolean f1Unlocked = completedLevels >= 1;
        fragments.add(RecoveryFragmentDto.builder()
                .fragmentNumber(1)
                .title("SYSTEM TRACE: K-17")
                .status(f1Unlocked ? "UNLOCKED" : "ENCRYPTED")
                .technicalArtifact(f1Unlocked ? "SYSTEM TRACE: K-17" : "[ENCRYPTED]")
                .narrativeContent(f1Unlocked
                        ? "> TRACE COMPLETE\n> EVENT SOURCE: K-17\n> NODE REGISTRY: NO MATCH\n> NETWORK MAP: NO MATCH\n> SOURCE STATUS: UNKNOWN\n> Someone removed this node from the map."
                        : "[ENCRYPTED // COMPLETE LEVEL 1 TO DECRYPT]")
                .build());

        // Fragment 02 - Level 2
        boolean f2Unlocked = completedLevels >= 2;
        fragments.add(RecoveryFragmentDto.builder()
                .fragmentNumber(2)
                .title("HIDDEN ROUTE")
                .status(f2Unlocked ? "UNLOCKED" : "ENCRYPTED")
                .technicalArtifact(f2Unlocked ? "HIDDEN ROUTE CONFIRMED" : "[ENCRYPTED]")
                .narrativeContent(f2Unlocked
                        ? "DATA ROUTE RECOVERED\nOFFICIAL PATH: INVALID\nALTERNATE PATH: DETECTED\nORIGIN: [REDACTED]\nDESTINATION: NODE 06\nSTATUS: ACTIVE"
                        : "[ENCRYPTED // COMPLETE LEVEL 2 TO DECRYPT]")
                .build());

        // Fragment 03 - Level 3
        boolean f3Unlocked = completedLevels >= 3;
        fragments.add(RecoveryFragmentDto.builder()
                .fragmentNumber(3)
                .title("GHOST SIGNAL")
                .status(f3Unlocked ? "UNLOCKED" : "ENCRYPTED")
                .technicalArtifact(f3Unlocked ? "GHOST SIGNAL CONFIRMED" : "[ENCRYPTED]")
                .narrativeContent(f3Unlocked
                        ? "NETWORK EVENT DETECTED\nSOURCE: NODE 06\nSTATUS: INTERMITTENT\nSIGNAL LOST...\n...\nSIGNAL RESTORED\nTRIGGER CONDITION IDENTIFIED\nNODE 06 IS NOT A NETWORK ERROR."
                        : "[ENCRYPTED // COMPLETE LEVEL 3 TO DECRYPT]")
                .build());

        // Fragment 04 - Level 4
        boolean f4Unlocked = completedLevels >= 4;
        fragments.add(RecoveryFragmentDto.builder()
                .fragmentNumber(4)
                .title("PROJECT SIX")
                .status(f4Unlocked ? "UNLOCKED" : "ENCRYPTED")
                .technicalArtifact(f4Unlocked ? "PROJECT SIX CONFIRMED" : "[ENCRYPTED]")
                .narrativeContent(f4Unlocked
                        ? "ARCHIVE RECORD RECOVERED\nPROJECT: SIX\nCLASSIFICATION: RESTRICTED\nSTATUS: ARCHIVED\nAUTHORIZED PERSONNEL: [REDACTED]\nPROJECT SIX WAS NOT AN INTRUSION PROJECT.\nPROJECT SIX WAS CREATED INSIDE THE NETWORK."
                        : "[ENCRYPTED // COMPLETE LEVEL 4 TO DECRYPT]")
                .build());

        // Fragment 05 - Level 5
        boolean f5Unlocked = completedLevels >= 5;
        fragments.add(RecoveryFragmentDto.builder()
                .fragmentNumber(5)
                .title("FAILSAFE PURPOSE")
                .status(f5Unlocked ? "UNLOCKED" : "ENCRYPTED")
                .technicalArtifact(f5Unlocked ? "FAILSAFE PURPOSE IDENTIFIED" : "[ENCRYPTED]")
                .narrativeContent(f5Unlocked
                        ? "SYSTEM ARCHITECTURE:\nNODES 01–05 — PRIMARY NETWORK\nNODE 06 — INDEPENDENT\nCONTROL AUTHORITY: NONE\nPURPOSE: RECOVERY\nNODE 06 WAS DESIGNED TO OPERATE IF THE PRIMARY NETWORK FAILED."
                        : "[ENCRYPTED // COMPLETE LEVEL 5 TO DECRYPT]")
                .build());

        // Fragment 06 - Level 6 / Completion
        fragments.add(RecoveryFragmentDto.builder()
                .fragmentNumber(6)
                .title("FINAL ACCESS SEQUENCE")
                .status(isCompleted ? "UNLOCKED" : "ENCRYPTED")
                .technicalArtifact(isCompleted ? "RECOVERY SEQUENCE VERIFIED" : "[ENCRYPTED]")
                .narrativeContent(isCompleted
                        ? "ACCESS GRANTED\nSYSTEM RECOVERY INITIATED\nNODE 01 ... RESTORED\nNODE 02 ... RESTORED\nNODE 03 ... RESTORED\nNODE 04 ... RESTORED\nNODE 05 ... RESTORED\nNODE 06 ... VERIFIED\nNETWORK INTEGRITY: 100%\nCODEXCAPE COMPLETE\n\nYOU FOUND ME.\nBUT THAT WAS NEVER THE REAL TEST.\nTHE REAL TEST WAS WHETHER YOU COULD FIND WHAT WAS HIDDEN IN PLAIN SIGHT."
                        : "[ENCRYPTED // AWAITING DUAL OPERATOR MASTER OVERRIDE SYNTHESIS]")
                .build());

        return fragments;
    }
}
