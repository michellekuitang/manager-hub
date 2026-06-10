const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getMarques, createMarque, updateMarque, deleteMarque } = require('../controllers/marqueController');

router.get('/', auth, getMarques);
router.post('/', auth, createMarque);
router.put('/:id', auth, updateMarque);
router.delete('/:id', auth, deleteMarque);

module.exports = router;