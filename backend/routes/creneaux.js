const express = require('express');
const router = express.Router();
const creneauController = require('../controllers/creneauController');

// Routes de l'API pour les créneaux
router.get('/', creneauController.getCreneaux);
router.post('/', creneauController.createCreneau);
router.delete('/:id', creneauController.deleteCreneau); // 🚀 Nouvelle route de suppression

module.exports = router;