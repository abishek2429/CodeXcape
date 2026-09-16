const express = require('express');
const router = express.Router();

const publicRoutes = require('./publicRoutes');
const playerRoutes = require('./playerRoutes');
const adminRoutes = require('./adminRoutes');

router.use('/', publicRoutes);
router.use('/player', playerRoutes);
router.use('/admin', adminRoutes);

module.exports = router;
