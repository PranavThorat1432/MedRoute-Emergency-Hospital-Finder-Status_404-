const express = require('express');
const router = express.Router();
const {
  getAllHospitals,
  getEmergencyHospitals,
  getHospitalById,
} = require('../controller/hospitalController.js');

router.get('/', getAllHospitals);
router.get('/emergency', getEmergencyHospitals);
router.get('/:id', getHospitalById);

module.exports = router;
