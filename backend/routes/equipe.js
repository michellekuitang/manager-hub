const express = require('express');
const router = express.Router();
const equipeController = require('../controllers/equipeController');

// Routes pour /api/equipe
router.get('/', equipeController.getMembres);
router.post('/', equipeController.createMembre);
router.put('/:id', equipeController.updateMembre);
router.delete('/:id', equipeController.deleteMembre);

module.exports = router;