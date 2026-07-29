const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getCreneaux, createCreneau, updateCreneau, deleteCreneau } = require('../controllers/creneauController');

router.get('/', auth, getCreneaux);
router.post('/', auth, createCreneau);
router.put('/:id', auth, updateCreneau);
router.delete('/:id', auth, deleteCreneau);

module.exports = router;