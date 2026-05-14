const express = require('express');
const router = express.Router();
const {
  getAllHospitals,
  getEmergencyHospitals,
  getHospitalById,
} = require('../controllers/hospitalController');

router.get('/', getAllHospitals);
router.get('/emergency', getEmergencyHospitals);
router.get('/:id', getHospitalById);

module.exports = router;
