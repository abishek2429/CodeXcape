const teamRepository = require('../repositories/teamRepository');
const playerRepository = require('../repositories/playerRepository');
const teamLevelProgressRepository = require('../repositories/teamLevelProgressRepository');
const { ResourceNotFoundException } = require('../middleware/errorHandler');

class StorylineService {
  async getStorylineForPlayer(principal) {
    if (!principal) throw new ResourceNotFoundException('No authenticated player session found.');
    const team = await teamRepository.findById(principal.teamId);
    if (!team) throw new ResourceNotFoundException('Team not found.');
    const player = await playerRepository.findById(principal.playerId);
    if (!player) throw new ResourceNotFoundException('Player not found.');

    return this.buildStorylineState(team, player.player_number);
  }

  async getStorylineForTeamAdmin(teamId) {
    const team = await teamRepository.findById(teamId);
    if (!team) throw new ResourceNotFoundException('Team not found.');
    return this.buildStorylineState(team, 1);
  }

  async buildStorylineState(team, playerNumber) {
    const progressList = await teamLevelProgressRepository.findByTeamIdOrderByLevelIdAsc(team.id);

    let completedLevels = 0;
    for (const p of progressList) {
      if (p.levelStatus === 'COMPLETED') completedLevels++;
    }

    let currentLevel = 1;
    const activeProgress = progressList.find(
      p => p.levelStatus === 'AVAILABLE' || p.levelStatus === 'IN_PROGRESS'
    );
    if (activeProgress) {
      currentLevel = activeProgress.level.levelNumber;
    } else if (team.gameState === 'FINAL_PASSKEY' || team.gameState === 'COMPLETED') {
      currentLevel = 6;
    }

    const isCompleted = (team.gameState === 'COMPLETED');
    const isFinalPasskey = (team.gameState === 'FINAL_PASSKEY');

    let integrityPercent = 87;
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

    let themeTitle = 'THE DISCREPANCY';
    let activeObjective = '01 — LOCATE NODE 06';
    let alert = 'UNAUTHORIZED COMMUNICATION DETECTED // SOURCE: UNMAPPED RELAY';
    let playerPerspective = '';

    switch (currentLevel) {
      case 1:
        themeTitle = 'THE DISCREPANCY';
        activeObjective = '01 — LOCATE NODE 06';
        alert = 'UNAUTHORIZED COMMUNICATION DETECTED // SOURCE: UNMAPPED RELAY';
        playerPerspective = (playerNumber === 1)
          ? '[NODE 01 INGRESS] Asymmetric log stream collision observed. Trace abnormal relay state transitions.'
          : '[NODE 02 TOPOLOGY] Channel K possesses no official registration in Node 01-05 map. Decouple decoys.';
        break;
      case 2:
        themeTitle = 'THE HIDDEN PATH';
        activeObjective = '02 — TRACE ITS ORIGIN';
        alert = 'OFFICIAL ROUTE INVALID // ALTERNATE DATA PATH DETECTED';
        playerPerspective = (playerNumber === 1)
          ? '[NODE 01 INGRESS] Fragmented bytes recovered bypassing official data gateway. Assembly required.'
          : '[NODE 02 TOPOLOGY] Boundary order confirms alternate hidden route communicating with NODE 06.';
        break;
      case 3:
        themeTitle = 'THE GHOST SIGNAL';
        activeObjective = '02 — TRACE ITS ORIGIN';
        alert = 'INTERMITTENT EMISSION DETECTED // NODE 06 ACTIVE UNDER SPECIFIC TRIGGERS';
        playerPerspective = (playerNumber === 1)
          ? '[NODE 01 INGRESS] Pulse origin isolated at Node A through router B. Dropped packets contain decoys.'
          : '[NODE 02 TOPOLOGY] Intermittent forwarding path C->E isolates verified transmission trigger.';
        break;
      case 4:
        themeTitle = 'THE ARCHIVE';
        activeObjective = '03 — DETERMINE ITS PURPOSE';
        alert = 'PROJECT SIX DISCOVERED // CLASSIFIED INTERNAL REPOSITORY ACCESSED';
        playerPerspective = (playerNumber === 1)
          ? '[NODE 01 INGRESS] Cipher behavior matches internal architecture specification archives.'
          : '[NODE 02 TOPOLOGY] Decryption reveals Project SIX originated INSIDE the network, not an external breach.';
        break;
      case 5:
        themeTitle = 'THE CREATOR';
        activeObjective = '03 — DETERMINE ITS PURPOSE';
        alert = 'PRIMARY ARCHITECTURE FAILING // ISOLATED FAILSAFE IDENTIFIED';
        playerPerspective = (playerNumber === 1)
          ? '[NODE 01 INGRESS] Forensic chain confirms Node 06 is independent of Nodes 01-05 control authority.'
          : '[NODE 02 TOPOLOGY] Architecture recovered: Node 06 was built to preserve system if primary network collapsed.';
        break;
      case 6:
      default:
        themeTitle = 'THE TRUTH';
        activeObjective = '04 — RECOVER THE FINAL ACCESS SEQUENCE';
        alert = isCompleted
          ? 'SYSTEM RESTORED // ALL PRIMARY NODES OPERATIONAL // INTEGRITY 100%'
          : 'PRIMARY NODES CRITICAL // EMERGENCY OVERRIDE PROTOCOL ENGAGED';
        playerPerspective = (playerNumber === 1)
          ? '[NODE 01 INGRESS] Odd parity dependency shards ready for master core protocol synthesis.'
          : '[NODE 02 TOPOLOGY] Even parity dependency shards aligned. Dual-operator authorization required.';
        break;
    }

    const fragments = this.buildRecoveryFragments(completedLevels, isCompleted);
    let latestUnlockNarrative = null;
    if (completedLevels > 0 && completedLevels <= 5) {
      latestUnlockNarrative = fragments[completedLevels - 1].narrativeContent;
    } else if (isCompleted) {
      latestUnlockNarrative = 'ACCESS GRANTED. SYSTEM RECOVERY INITIATED. ALL NODES RESTORED.';
    }

    return {
      currentLevel,
      themeTitle,
      networkIntegrityPercent: integrityPercent,
      activeObjective,
      playerPerspectiveLog: playerPerspective,
      environmentalAlert: alert,
      latestUnlockNarrative,
      fragments
    };
  }

  buildRecoveryFragments(completedLevels, isCompleted) {
    return [
      {
        fragmentNumber: 1,
        title: 'CORE RECOVERY FRAGMENT 01',
        status: completedLevels >= 1 ? 'UNLOCKED' : 'ENCRYPTED',
        technicalArtifact: completedLevels >= 1 ? 'LOG INTEGRITY VERIFIED' : '[ENCRYPTED]',
        narrativeContent: completedLevels >= 1
          ? '> TRACE COMPLETE\n> EVENT SOURCE: CORE TELEMETRY\n> NODE REGISTRY: NO MATCH\n> NETWORK MAP: NO MATCH\n> SOURCE STATUS: UNKNOWN\n> Someone removed this node from the map.'
          : '[ENCRYPTED // COMPLETE LEVEL 1 TO DECRYPT]'
      },
      {
        fragmentNumber: 2,
        title: 'HIDDEN ROUTE',
        status: completedLevels >= 2 ? 'UNLOCKED' : 'ENCRYPTED',
        technicalArtifact: completedLevels >= 2 ? 'HIDDEN ROUTE CONFIRMED' : '[ENCRYPTED]',
        narrativeContent: completedLevels >= 2
          ? 'DATA ROUTE RECOVERED\nOFFICIAL PATH: INVALID\nALTERNATE PATH: DETECTED\nORIGIN: [REDACTED]\nDESTINATION: NODE 06\nSTATUS: ACTIVE'
          : '[ENCRYPTED // COMPLETE LEVEL 2 TO DECRYPT]'
      },
      {
        fragmentNumber: 3,
        title: 'GHOST SIGNAL',
        status: completedLevels >= 3 ? 'UNLOCKED' : 'ENCRYPTED',
        technicalArtifact: completedLevels >= 3 ? 'GHOST SIGNAL CONFIRMED' : '[ENCRYPTED]',
        narrativeContent: completedLevels >= 3
          ? 'NETWORK EVENT DETECTED\nSOURCE: NODE 06\nSTATUS: INTERMITTENT\nSIGNAL LOST...\n...\nSIGNAL RESTORED\nTRIGGER CONDITION IDENTIFIED\nNODE 06 IS NOT A NETWORK ERROR.'
          : '[ENCRYPTED // COMPLETE LEVEL 3 TO DECRYPT]'
      },
      {
        fragmentNumber: 4,
        title: 'PROJECT SIX',
        status: completedLevels >= 4 ? 'UNLOCKED' : 'ENCRYPTED',
        technicalArtifact: completedLevels >= 4 ? 'PROJECT SIX CONFIRMED' : '[ENCRYPTED]',
        narrativeContent: completedLevels >= 4
          ? 'ARCHIVE RECORD RECOVERED\nPROJECT: SIX\nCLASSIFICATION: RESTRICTED\nSTATUS: ARCHIVED\nAUTHORIZED PERSONNEL: [REDACTED]\nPROJECT SIX WAS NOT AN INTRUSION PROJECT.\nPROJECT SIX WAS CREATED INSIDE THE NETWORK.'
          : '[ENCRYPTED // COMPLETE LEVEL 4 TO DECRYPT]'
      },
      {
        fragmentNumber: 5,
        title: 'FAILSAFE PURPOSE',
        status: completedLevels >= 5 ? 'UNLOCKED' : 'ENCRYPTED',
        technicalArtifact: completedLevels >= 5 ? 'FAILSAFE PURPOSE IDENTIFIED' : '[ENCRYPTED]',
        narrativeContent: completedLevels >= 5
          ? 'SYSTEM ARCHITECTURE:\nNODES 01–05 — PRIMARY NETWORK\nNODE 06 — INDEPENDENT\nCONTROL AUTHORITY: NONE\nPURPOSE: RECOVERY\nNODE 06 WAS DESIGNED TO OPERATE IF THE PRIMARY NETWORK FAILED.'
          : '[ENCRYPTED // COMPLETE LEVEL 5 TO DECRYPT]'
      }
    ];
  }
}

module.exports = new StorylineService();
