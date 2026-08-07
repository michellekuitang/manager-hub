const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getWeeklyReport } = require('../controllers/rapportController');

// Route : GET /api/rapports
router.get('/', auth, getWeeklyReport);

module.exports = router;