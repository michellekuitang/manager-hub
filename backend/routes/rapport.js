const express = require('express');
const router = express.Router();
const { getWeeklyReport } = require('../controllers/rapportController');

// Route : GET /api/rapports
router.get('/', getWeeklyReport);

module.exports = router;