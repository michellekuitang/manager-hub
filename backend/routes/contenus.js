const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getContenus, createContenu, updateStatutContenu, updateContenu, deleteContenu } = require('../controllers/contenuController');

router.get('/', auth, getContenus);
router.post('/', auth, createContenu);
router.patch('/:id/statut', auth, updateStatutContenu);
router.put('/:id', auth, updateContenu);
router.delete('/:id', auth, deleteContenu);

module.exports = router;