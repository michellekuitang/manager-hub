const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getIntervenants, createIntervenant, updateIntervenant, deleteIntervenant } = require('../controllers/intervenantController');

router.get('/', auth, getIntervenants);
router.post('/', auth, createIntervenant);
router.put('/:id', auth, updateIntervenant);
router.delete('/:id', auth, deleteIntervenant);

module.exports = router;