const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { upload } = require('../config/cloudinary.js');
const {
  login,
  getAllHospitals,
  createHospital,
  updateHospital,
  deleteHospital,
  updateAvailability,
} = require('../controller/adminController.js');

router.post('/login', login);
router.get('/hospitals', auth, getAllHospitals);
router.post('/hospitals', auth, upload.single('image'), createHospital);
router.put('/hospitals/:id', auth, upload.single('image'), updateHospital);
router.delete('/hospitals/:id', auth, deleteHospital);
router.patch('/hospitals/:id/availability', auth, updateAvailability);

module.exports = router;
