const express = require('express');
const router = express.Router();
const {
  getVehicles,
  addVehicle,
  updateVehicle,
  deleteVehicle
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');

// Protect all vehicle operations
router.use(protect);

router.route('/')
  .get(getVehicles)
  .post(addVehicle);

router.route('/:id')
  .put(updateVehicle)
  .delete(deleteVehicle);

module.exports = router;
