const express = require('express');
const router = express.Router();
const multer = require('multer');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});

const { authenticateAdmin } = require('../middleware/authMiddleware');

const adminAuthController = require('../controllers/admin/adminAuthController');
const adminEventController = require('../controllers/admin/adminEventController');
const adminTeamController = require('../controllers/admin/adminTeamController');
const adminContentController = require('../controllers/admin/adminContentController');
const adminResultsController = require('../controllers/admin/adminResultsController');
const adminAntiCheatController = require('../controllers/admin/adminAntiCheatController');
const adminStoryController = require('../controllers/admin/adminStoryController');

// Public Admin Auth
router.post('/login', (req, res, next) => adminAuthController.login(req, res, next));
router.post('/logout', (req, res, next) => adminAuthController.logout(req, res, next));

// Authenticated Admin Routes
router.use(authenticateAdmin);

// Events
router.post('/events', (req, res, next) => adminEventController.createEvent(req, res, next));
router.get('/events', (req, res, next) => adminEventController.listEvents(req, res, next));
router.get('/events/audit-logs', (req, res, next) => adminEventController.getAuditLogs(req, res, next));
router.get('/events/:eventId', (req, res, next) => adminEventController.getEvent(req, res, next));
router.put('/events/:eventId', (req, res, next) => adminEventController.updateEvent(req, res, next));
router.patch('/events/:eventId/status', (req, res, next) => adminEventController.updateEventStatus(req, res, next));
router.post('/events/:eventId/start', (req, res, next) => adminEventController.startEvent(req, res, next));
router.post('/events/:eventId/pause', (req, res, next) => adminEventController.pauseEvent(req, res, next));
router.post('/events/:eventId/resume', (req, res, next) => adminEventController.resumeEvent(req, res, next));
router.post('/events/:eventId/end', (req, res, next) => adminEventController.endEvent(req, res, next));
router.post('/events/:eventId/emergency-stop', (req, res, next) => adminEventController.emergencyStop(req, res, next));
router.post('/events/:eventId/passkey', (req, res, next) => adminEventController.updatePasskey(req, res, next));
router.get('/events/:eventId/dashboard', (req, res, next) => adminEventController.getDashboardStats(req, res, next));

// Teams
router.post('/events/:eventId/teams', (req, res, next) => adminTeamController.createTeam(req, res, next));
router.get('/events/:eventId/teams', (req, res, next) => adminTeamController.listTeamsForEvent(req, res, next));
router.get('/teams/:teamId', (req, res, next) => adminTeamController.getTeam(req, res, next));
router.put('/teams/:teamId', (req, res, next) => adminTeamController.updateTeam(req, res, next));
router.patch('/teams/:teamId/status', (req, res, next) => adminTeamController.updateTeamStatus(req, res, next));
router.delete('/teams/:teamId', (req, res, next) => adminTeamController.deleteTeam(req, res, next));

router.get('/events/:eventId/teams/progress', (req, res, next) => adminTeamController.getTeamsProgress(req, res, next));
router.post('/teams/:teamId/reset', (req, res, next) => adminTeamController.resetTeam(req, res, next));
router.post('/teams/:teamId/pause', (req, res, next) => adminTeamController.pauseTeam(req, res, next));
router.post('/teams/:teamId/resume', (req, res, next) => adminTeamController.resumeTeam(req, res, next));

router.get('/events/:eventId/active-sessions', (req, res, next) => adminTeamController.getActiveSessions(req, res, next));
router.post('/sessions/:sessionId/revoke', (req, res, next) => adminTeamController.revokeSession(req, res, next));
router.post('/teams/:teamId/reset-credentials', (req, res, next) => adminTeamController.resetTeamCredentials(req, res, next));
router.post('/teams/:teamId/revoke-sessions', (req, res, next) => adminTeamController.revokeTeamSessions(req, res, next));
router.post('/sessions/reset-all', (req, res, next) => adminTeamController.resetAllSessions(req, res, next));

// Excel Import
router.post('/events/:eventId/teams/import/preview', upload.single('file'), (req, res, next) => adminTeamController.previewExcelImport(req, res, next));
router.post('/events/:eventId/teams/import/confirm', upload.single('file'), (req, res, next) => adminTeamController.confirmExcelImport(req, res, next));

// Content
router.get('/events/:eventId/content', (req, res, next) => adminContentController.getAllContent(req, res, next));
router.get('/events/:eventId/validation', (req, res, next) => adminContentController.validateEventReadiness(req, res, next));
router.put('/events/:eventId/levels/:levelNumber/questions', (req, res, next) => adminContentController.saveQuestion(req, res, next));
router.put('/events/:eventId/levels/:levelNumber/hint', (req, res, next) => adminContentController.saveHint(req, res, next));
router.post('/events/:eventId/test-answer', (req, res, next) => adminContentController.testAnswer(req, res, next));
router.get('/events/:eventId/preview/player', (req, res, next) => adminContentController.getPlayerSafePreview(req, res, next));

// Results
router.get('/events/:eventId/leaderboard', (req, res, next) => adminResultsController.getLeaderboard(req, res, next));
router.get('/events/:eventId/teams/:teamId/scores', (req, res, next) => adminResultsController.getTeamScoreSummary(req, res, next));
router.get('/events/:eventId/teams/:teamId/score-events', (req, res, next) => adminResultsController.getTeamScoreEvents(req, res, next));
router.get('/events/:eventId/statistics', (req, res, next) => adminResultsController.getEventStatistics(req, res, next));
router.get('/events/:eventId/export/results', (req, res, next) => adminResultsController.exportResultsCsv(req, res, next));
router.get('/events/:eventId/export/progress', (req, res, next) => adminResultsController.exportProgressCsv(req, res, next));

// Anti-Cheat
router.get('/anti-cheat/events', (req, res, next) => adminAntiCheatController.getEventViolations(req, res, next));
router.get('/anti-cheat/summary', (req, res, next) => adminAntiCheatController.getEventSummaries(req, res, next));
router.get('/anti-cheat/team/:teamId', (req, res, next) => adminAntiCheatController.getTeamViolations(req, res, next));

// Story
router.get('/story/progress/:teamId', (req, res, next) => adminStoryController.getTeamStoryProgress(req, res, next));

module.exports = router;
