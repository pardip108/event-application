
const Express = require('express');
const router = Express.Router();

const { protect, admin } = require('../middleware/auth');
const { bookEvent, sendBookingOTP, getMyBookings, confirmBooking, cancelBooking } = require('../controllers/bookingController');


router.post('/', protect, bookEvent);
router.post('/send-otp', protect, sendBookingOTP);
router.get('/my', protect, getMyBookings);
router.put('/:id/confirm', protect, admin, confirmBooking);
router.delete('/:id', protect, cancelBooking);

module.exports = router;

 