const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getTournages, getTournageById, createTournage, updateTournage, deleteTournage } = require('../controllers/tournageController');

router.get('/', auth, getTournages);
router.get('/:id', auth, getTournageById);
router.post('/', auth, createTournage);
router.put('/:id', auth, updateTournage);
router.delete('/:id', auth, deleteTournage);

module.exports = router;