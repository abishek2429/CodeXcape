const express = require('express');
const router = express.Router();
const healthController = require('../controllers/healthController');
const publicLeaderboardController = require('../controllers/publicLeaderboardController');

router.get('/health', (req, res, next) => healthController.getHealth(req, res, next));
router.get('/public/events/:eventId/leaderboard', (req, res, next) => publicLeaderboardController.getPublicLeaderboard(req, res, next));

module.exports = router;
