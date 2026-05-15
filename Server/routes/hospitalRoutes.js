const express = require('express');
const router = express.Router();
const {
  getAllHospitals,
  getEmergencyHospitals,
  getHospitalById,
} = require('../controllers/hospitalController');
const { createHold, confirmHold } = require('../controllers/holdController');

router.get('/', getAllHospitals);
router.get('/emergency', getEmergencyHospitals);
router.post('/hold/:holdId/confirm', express.json(), confirmHold);
router.post('/:id/hold', express.json(), createHold);
router.get('/:id', getHospitalById);

module.exports = router;
