const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getCampagnes, getCampagneById, createCampagne, updateCampagne, deleteCampagne } = require('../controllers/campagneController');

router.get('/', auth, getCampagnes);
router.get('/:id', auth, getCampagneById);
router.post('/', auth, createCampagne);
router.put('/:id', auth, updateCampagne);
router.delete('/:id', auth, deleteCampagne);

module.exports = router;
