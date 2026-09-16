const teamRepository = require('../repositories/teamRepository');
const playerRepository = require('../repositories/playerRepository');
const teamLevelProgressRepository = require('../repositories/teamLevelProgressRepository');
const teamRiddleProgressRepository = require('../repositories/teamRiddleProgressRepository');
const auditService = require('./auditService');
const webSocketService = require('./webSocketService');
const {
  ResourceNotFoundException,
  EventUnavailableException
} = require('../middleware/errorHandler');

const RIDDLE_ANSWERS = {
  1: '3',
  2: '8',
  3: '2',
  4: '4',
  5: '5',
  6: '9'
};

class RiddleService {
  async getCompletedLevelsCount(team) {
    const progressList = await teamLevelProgressRepository.findByTeamIdOrderByLevelIdAsc(team.id);
    const countFromRepo = progressList.filter(p => p.levelStatus === 'COMPLETED').length;
    const countFromTeam = team.completedLevels || 0;
    return Math.max(countFromRepo, countFromTeam);
  }

  async validateEventAndTimer(team) {
    const event = team.event;
    let totalStoryPause = team.totalStoryPauseSeconds || 0;
    if (team.currentStoryKey && team.storyPausedAt) {
      totalStoryPause += Math.max(0, Math.floor((Date.now() - new Date(team.storyPausedAt).getTime()) / 1000));
    }

    if (team.startedAt) {
      const deadline = new Date(team.startedAt).getTime() + (100 * 60 + totalStoryPause) * 1000;
      if (Date.now() > deadline) {
        throw new EventUnavailableException('The 100-minute game window has ended. Time expired.');
      }
    }

    if (event.status === 'PAUSED') {
      throw new EventUnavailableException('The event is currently paused by the organizer.');
    }
    if (event.status !== 'RUNNING' && event.status !== 'READY') {
      throw new EventUnavailableException('The event is not currently active.');
    }
  }

  async getRiddleBoardState(principal) {
    if (!principal) throw new ResourceNotFoundException('No authenticated player session found.');
    const team = await teamRepository.findById(principal.teamId);
    if (!team) throw new ResourceNotFoundException(`Team not found for ID ${principal.teamId}`);

    const completedLevels = await this.getCompletedLevelsCount(team);
    const progressList = await teamRiddleProgressRepository.findByTeamIdOrderByRiddleIndexAsc(team.id);

    const progressMap = new Map();
    for (const p of progressList) {
      progressMap.set(p.riddleIndex, p);
    }

    const itemDtos = [];
    let solvedCount = 0;
    let unlockedCount = 0;

    for (let i = 1; i <= 6; i++) {
      const isUnlocked = completedLevels >= i;
      const p = progressMap.get(i);
      const isSolved = p && p.isSolved;

      let status = 'LOCKED';
      let solvedDigit = null;

      if (isSolved) {
        status = 'SOLVED';
        solvedDigit = p.solvedDigit;
        solvedCount++;
        unlockedCount++;
      } else if (isUnlocked) {
        status = 'UNLOCKED';
        unlockedCount++;
      }

      itemDtos.push({
        riddleIndex: i,
        levelNumber: i,
        status,
        solvedDigit
      });
    }

    return {
      totalRiddles: 6,
      unlockedCount,
      solvedCount,
      allRiddlesSolved: (solvedCount === 6),
      riddles: itemDtos
    };
  }

  async submitRiddleAnswer(principal, request) {
    if (!principal) throw new ResourceNotFoundException('No authenticated player session found.');
    const riddleIndex = parseInt(request.riddleIndex, 10);
    const submittedDigit = request.digit ? request.digit.trim() : '';

    const team = await teamRepository.findById(principal.teamId);
    if (!team) throw new ResourceNotFoundException(`Team not found for ID ${principal.teamId}`);

    const player = await playerRepository.findById(principal.playerId);
    if (!player) throw new ResourceNotFoundException(`Player not found for ID ${principal.playerId}`);

    await this.validateEventAndTimer(team);

    const completedLevels = await this.getCompletedLevelsCount(team);
    if (completedLevels < riddleIndex) {
      return {
        riddleIndex,
        status: 'LOCKED',
        message: `Riddle ${riddleIndex} is locked. Complete Level ${riddleIndex} first.`
      };
    }

    let progress = await teamRiddleProgressRepository.findByTeamIdAndRiddleIndex(team.id, riddleIndex);
    if (!progress) {
      progress = await teamRiddleProgressRepository.save({
        teamId: team.id,
        riddleIndex,
        isSolved: false,
        wrongAttempts: 0
      });
    }

    if (progress.isSolved) {
      const totalSolved = await this.countSolvedRiddles(team.id);
      return {
        riddleIndex,
        status: 'SOLVED',
        message: 'Riddle is already solved.',
        solvedDigit: progress.solvedDigit,
        allRiddlesSolved: (totalSolved === 6)
      };
    }

    // Rate Limiting
    const now = Date.now();
    if (progress.lastAttemptAt) {
      const secondsSinceLast = Math.floor((now - new Date(progress.lastAttemptAt).getTime()) / 1000);
      if (secondsSinceLast < 2) {
        return {
          riddleIndex,
          status: 'RATE_LIMITED',
          message: 'Submission rate limit reached. Please wait a few seconds before trying again.'
        };
      }
      if (progress.wrongAttempts >= 5 && secondsSinceLast < 10) {
        return {
          riddleIndex,
          status: 'RATE_LIMITED',
          message: 'Too many attempts. Cooldown active. Try again in 10 seconds.'
        };
      }
    }

    const expectedDigit = RIDDLE_ANSWERS[riddleIndex];
    const isCorrect = (expectedDigit && expectedDigit === submittedDigit);

    if (isCorrect) {
      progress.isSolved = true;
      progress.solvedDigit = expectedDigit;
      progress.solvedAt = new Date().toISOString();
      progress.solvedByPlayerId = player.id;
      await teamRiddleProgressRepository.save(progress);

      team.stateVersion = (team.stateVersion || 1) + 1;
      await teamRepository.save(team);

      const totalSolved = await this.countSolvedRiddles(team.id);

      await auditService.logEvent(
        'ANSWER_CORRECT',
        team.event,
        team,
        player,
        { type: 'RIDDLE_SUBMISSION', riddleIndex, result: 'CORRECT' },
        'PLAYER'
      );

      const riddleEvent = {
        type: 'RIDDLE_SOLVED',
        teamId: team.id,
        playerId: player.id,
        playerNumber: player.player_number,
        riddleIndex,
        solvedDigit: expectedDigit,
        solvedCount: totalSolved,
        allRiddlesSolved: (totalSolved === 6),
        stateVersion: team.stateVersion,
        message: `Operator 0${player.player_number} solved Riddle ${riddleIndex} [Digit: ${expectedDigit}] ✓`,
        timestamp: new Date().toISOString()
      };

      webSocketService.broadcastToTeam(team.id, riddleEvent);
      webSocketService.broadcastToTeam(team.id, {
        ...riddleEvent,
        type: 'GAME_STATE_UPDATED'
      });

      return {
        riddleIndex,
        status: 'SOLVED',
        message: 'CORRECT. RIDDLE SOLVED.',
        solvedDigit: expectedDigit,
        allRiddlesSolved: (totalSolved === 6),
        stateVersion: team.stateVersion
      };
    } else {
      progress.wrongAttempts = (progress.wrongAttempts || 0) + 1;
      progress.lastAttemptAt = new Date().toISOString();
      await teamRiddleProgressRepository.save(progress);

      await auditService.logEvent(
        'ANSWER_WRONG',
        team.event,
        team,
        player,
        { type: 'RIDDLE_SUBMISSION', riddleIndex, result: 'INCORRECT' },
        'PLAYER'
      );

      return {
        riddleIndex,
        status: 'INCORRECT',
        message: 'INCORRECT. RE-EXAMINE THE CLUES CAREFULLY.'
      };
    }
  }

  async areAllRiddlesSolvedForTeam(teamId) {
    if (!teamId) return false;
    const progressList = await teamRiddleProgressRepository.findByTeamIdOrderByRiddleIndexAsc(teamId);
    const solvedCount = progressList.filter(r => r.isSolved).length;
    return (solvedCount === 6);
  }

  async countSolvedRiddles(teamId) {
    const progressList = await teamRiddleProgressRepository.findByTeamIdOrderByRiddleIndexAsc(teamId);
    return progressList.filter(r => r.isSolved).length;
  }
}

module.exports = new RiddleService();
