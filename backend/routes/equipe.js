const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const equipeController = require('../controllers/equipeController');

// Routes pour /api/equipe
router.get('/', auth, equipeController.getMembres);
router.post('/', auth, equipeController.createMembre);
router.put('/:id', auth, equipeController.updateMembre);
router.delete('/:id', auth, equipeController.deleteMembre);

module.exports = router;