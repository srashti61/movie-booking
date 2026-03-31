// routes/bookingRoutes.js
const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { auth } = require('../middleware/auth');

// @route   GET /api/bookings/all
// @desc    Get all bookings (admin only)
// @access  Private/Admin
router.get('/all', auth, bookingController.getAllBookings);

// All routes require authentication
router.use(auth);

// @route   GET /api/bookings
// @desc    Get user bookings
// @access  Private
router.get('/', bookingController.getUserBookings);

// @route   GET /api/bookings/:id
// @desc    Get booking by ID
// @access  Private
router.get('/:id', bookingController.getBookingById);

// @route   POST /api/bookings
// @desc    Create booking
// @access  Private
router.post('/', bookingController.createBooking);

// @route   PUT /api/bookings/:id/cancel
// @desc    Cancel booking
// @access  Private
router.put('/:id/cancel', bookingController.cancelBooking);

// @route   POST /api/bookings/:id/payment
// @desc    Process payment for booking
// @access  Private
router.post('/:id/payment', auth, bookingController.processPayment);



// @route   GET /api/bookings/ticket/:ticketNumber
// @desc    Get booking by ticket number
// @access  Private
router.get('/ticket/:ticketNumber', bookingController.getBookingByTicket);

module.exports = router;