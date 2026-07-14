
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
    
    try {
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

        const existingBooking = await Booking.findOne({ userId: req.user._id, eventId: eventId});
        if (existingBooking && existingBooking.status === 'cancelled') {
            return res.status(400).json({ error: 'You have already booked this event or have a pending booking' });
        }


        const booking = new Booking({
            userId: req.user._id,
            eventId: eventId,
            amount: event.ticketPrice,
            status: 'pending',
            paymentStatus: 'unpaid'
        });

        await OTP.deleteOne({ _id: otpRecord._id }); // Remove the OTP after successful booking
        res.status(201).json({ message: 'Booking request submitted successfully', booking });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error booking event' });
    }

}

exports.confirmBooking = async (req, res) => {

    try {
        const paymentStatus = req.body;

        const booking = await Booking.findById(req.params.bookingId).populate('eventId');
        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        if (booking.status === 'confirmed') {
            return res.status(400).json({ error: 'Booking is already confirmed' });
        }

        const event = await Event.findById(booking.eventId);
        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }
        
        if (event.availableSeats <= 0) {
            return res.status(400).json({ error: 'No available seats for this event' });
        }

        booking.status = 'confirmed';
        
        if(paymentStatus) {
            booking.paymentStatus = paymentStatus;
        }

        await booking.save();

        // Decrease the available seats for the event
        event.availableSeats -= 1;
        await event.save();

        // Send confirmation email
        await sendBookingEmail(req.userId.email, booking.userId.name, booking.eventId.title);     

        res.status(200).json({ message: 'Booking confirmed successfully', bookingId: booking._id });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error confirming booking' });
    }
    
}; 


exports.getMyBookings = async (req, res) => {
    try {
        const bookings = req.user.role === 'admin'
            ? await Booking.find().populate('eventId').populate('userId', 'name email').sort({ createdAt: -1 })
            : await Booking.find({ userId: req.user._id }).populate('eventId').sort({ createdAt: -1 });
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

        if (booking.userId.toString() !== req.user._id && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'You are not authorized to cancel this booking' });
        }

        if(booking.status === 'cancelled') {
            return res.status(400).json({ error: 'Booking is already cancelled' });
        }

        const wasConfirmed = booking.status === 'confirmed';

        booking.status = 'cancelled';
        await booking.save();

        //Only increase available seats if the booking was confirmed
        if (wasConfirmed) {
            const event = await Event.findById(booking.eventId);
            if (event) {
                event.availableSeats += 1;
                await event.save();
            }
        }

        res.status(200).json({ message: 'Booking cancelled successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error cancelling booking' });
    }
};  


