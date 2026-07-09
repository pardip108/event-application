 
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
dotenv.config(); 

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS                                                                                
    }
})



const sendBookingEmail = async (userEmail,userName , eventTitle) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: userEmail   ,
            subject: 'Booking Confirmation',
            text: `✨ Great news, ${userName}! Your booking for "${eventTitle}" has been confirmed. Get ready for an amazing experience!`
        }

        await transporter.sendMail(mailOptions);
        console.log(`Booking confirmation email sent to ${userEmail}`);
    } catch (error) {
        console.error(`Error sending booking confirmation email to ${userEmail}:`, error);
    }
}

const sendOTPEmail = async (userEmail, otp, type) => {
    try {
        const title = type === 'account_verification' ? 'Verify your event application account' : 'Event booking verification code';
        const msg = type === 'account_verification' ? 'Please use the following OTP to verify your account: ' : 'Please use the following OTP to complete your booking: ';

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: userEmail,
            subject: title,
            html: `<p>${msg}</p><p>OTP: <strong>${otp}</strong></p>`
        }

        await transporter.sendMail(mailOptions);
        console.log(`OTP email sent to ${userEmail} for ${type}`);
    } catch (error) {
        console.error(`Error sending OTP email to ${userEmail}:`, error);
    }
}
