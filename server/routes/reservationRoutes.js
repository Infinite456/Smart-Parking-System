const express = require('express');
const router = express.Router();
const {
  createReservation,
  getReservations,
  cancelReservation
} = require('../controllers/reservationController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .post(createReservation)
  .get(getReservations);

router.route('/:id/cancel')
  .put(cancelReservation);

module.exports = router;
