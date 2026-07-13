
const Booking = require('../models/Booking');
const OTP = require('../models/OTP');
const Event = require('../models/Event');
const {sendOTPEmail, sendBookingEmail} = require('../utils/email');


const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString(); // Generate a 6-digit OTP
}

exports.sendBookingOTP = async (req, res) => {
    try {
        const otpCode = generateOTP();
        await OTP.findOneAndDelete({ email: req.body.email, action: 'event_booking' }); // Remove any existing OTP for the email
        await OTP.create({ email: req.body.email, otp: otpCode, action: 'event_booking'}); 
        await sendOTPEmail(req.body.email, otpCode, 'event booking');
        res.status(200).json({ message: 'OTP sent successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error sending OTP' });
    }
};

exports.bookEvent = async (req, res) => {
    const { eventId, email, otp} = req.body;
     
    const otpRecord = await OTP.findOne({ email: email, otp: otp , action: 'event_booking' });
    if (!otpRecord) {
        return res.status(400).json({ error: 'Invalid OTP' });
    }

    const event = await Event.findById(eventId);
    if (!event) {
        return res.status(404).json({ error: 'Event not found' });
    }

    if(event.availableSeats <= 0) {
        return res.status(400).json({ error: 'No available seats for this event' });
    }

    const existingBooking = await Booking.findOne({ user: userId, eventId: eventId});
    if (existingBooking) {
        return res.status(400).json({ error: 'You have already booked this event' });
    }


    const booking = new Booking({
        userId: req.user._id,
        eventId: eventId,
        amount: event.ticketPrice,
        status: 'pending',
        paymentStatus: 'unpaid'
    });

    await OTP.deleteMany({ email: email, action: 'event_booking' }); // Remove the OTP after successful booking
    res.status(201).json({ message: 'Booking created successfully', bookingId: booking._id });

}

exports.confirmBooking = async (req, res) => {
    const paymentStatus = req.body.paymentStatus;
    if (!['paid', 'unpaid'].includes(paymentStatus)) {
        return res.status(400).json({ error: 'Invalid payment status' });
    }

    const booking = await Booking.findById(req.params.bookingId).populate('eventId');
    if (!booking) {
        return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking.status === 'confirmed') {
        return res.status(400).json({ error: 'Booking is already confirmed' });
    }

    booking.satus = 'confirmed';
    
    if(paymentStatus) {
        booking.paymentStatus = paymentStatus;
    }

    await booking.save();

    // Decrease the available seats for the event
    const event = await Event.findById(booking.eventId);
    if (event.availableSeats > 0) {
        event.availableSeats -= 1;
        await event.save();
    } else {
        return res.status(400).json({ error: 'No available seats for this event' });
    }

    // Send confirmation email
    await sendBookingEmail(req.user.email, booking);     

    res.status(200).json({ message: 'Booking confirmed successfully', bookingId: booking._id });
}; 


exports.getMyBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({ userId: req.user._id }).populate('eventId');
        res.status(200).json(bookings);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error fetching bookings' });
    }
};

exports.cancelBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        if (booking.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'You are not authorized to cancel this booking' });
        }

        if (booking.status === 'confirmed') {
            // Increase the available seats for the event
            const event = await Event.findById(booking.eventId);
            event.availableSeats += 1;
            await event.save();
        }

        await booking.remove();
        res.status(200).json({ message: 'Booking cancelled successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error cancelling booking' });
    }
};  


