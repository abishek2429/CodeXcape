const express = require('express');
const router = express.Router();

const { authenticatePlayer } = require('../middleware/authMiddleware');
const { slidingWindowRateLimiter } = require('../middleware/rateLimitMiddleware');

const playerSessionController = require('../controllers/player/playerSessionController');
const playerGameStateController = require('../controllers/player/playerGameStateController');
const questionAnswerController = require('../controllers/player/questionAnswerController');
const playerScoreController = require('../controllers/player/playerScoreController');
const playerHintController = require('../controllers/player/playerHintController');
const playerRiddleController = require('../controllers/player/playerRiddleController');
const finalPasskeyController = require('../controllers/player/finalPasskeyController');
const playerStoryController = require('../controllers/player/playerStoryController');
const storylineController = require('../controllers/player/storylineController');
const antiCheatController = require('../controllers/player/antiCheatController');

// 1. Unauthenticated Login
router.post('/login', (req, res, next) => playerSessionController.login(req, res, next));

// Authenticated Routes below
router.use(authenticatePlayer);

// 2. Session & Lobby
router.post('/logout', (req, res, next) => playerSessionController.logout(req, res, next));
router.get('/me', (req, res, next) => playerSessionController.getCurrentPlayer(req, res, next));
router.get('/lobby', (req, res, next) => playerSessionController.getLobbyState(req, res, next));
router.post('/ready', (req, res, next) => playerSessionController.setReady(req, res, next));
router.post('/event/start', (req, res, next) => playerSessionController.startEvent(req, res, next));

// 3. Game Progression & Answering
router.get('/game', (req, res, next) => playerGameStateController.getPlayerGameState(req, res, next));
router.get('/game/current', (req, res, next) => playerGameStateController.getCurrentLevel(req, res, next));
router.get('/game/resync', (req, res, next) => playerGameStateController.getFullResyncState(req, res, next));
router.get('/game/current/question', (req, res, next) => questionAnswerController.getCurrentQuestion(req, res, next));
router.post('/game/current/answer', slidingWindowRateLimiter, (req, res, next) => questionAnswerController.submitAnswer(req, res, next));
router.get('/game/score', (req, res, next) => playerScoreController.getTeamScoreSummary(req, res, next));

// 4. Progressive Hints
router.get('/game/hints', (req, res, next) => playerHintController.getPlayerHints(req, res, next));
router.post('/game/hints/:levelNumber/:stageNumber/:hintNumber', (req, res, next) => playerHintController.useHint(req, res, next));

// 5. Riddles
router.get('/riddles', (req, res, next) => playerRiddleController.getRiddleBoardState(req, res, next));
router.post('/riddles/submit', slidingWindowRateLimiter, (req, res, next) => playerRiddleController.submitRiddleAnswer(req, res, next));

// 6. Final Key
router.post('/game/final-passkey', slidingWindowRateLimiter, (req, res, next) => finalPasskeyController.submitFinalPasskey(req, res, next));

// 7. Cinematic Story & Storyline
router.get('/game/story/current', (req, res, next) => playerStoryController.getCurrentStoryState(req, res, next));
router.post('/game/story/skip', (req, res, next) => playerStoryController.skipStory(req, res, next));
router.post('/game/story/complete', (req, res, next) => playerStoryController.completeStory(req, res, next));
router.post('/game/story/replay', (req, res, next) => playerStoryController.replayStory(req, res, next));
router.get('/game/story/history', (req, res, next) => playerStoryController.getResolvedStories(req, res, next));
router.get('/game/story', (req, res, next) => storylineController.getStoryline(req, res, next));

// 8. Anti-Cheat
router.post('/anti-cheat/event', slidingWindowRateLimiter, (req, res, next) => antiCheatController.reportEvent(req, res, next));
router.get('/anti-cheat/summary', (req, res, next) => antiCheatController.getTeamSummary(req, res, next));

module.exports = router;
