const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { genererContenu, getGenerations } = require('../controllers/iaController');

router.post('/generer', auth, genererContenu);
router.get('/historique', auth, getGenerations);

module.exports = router;