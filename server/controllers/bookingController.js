const Booking = require('../models/Booking');
const Show = require('../models/Show');
const Movie = require('../models/Movie');
const Theater = require('../models/Theater');
const User = require('../models/User');

// @desc    Create booking
// @route   POST /api/bookings
// @access  Private
exports.createBooking = async (req, res) => {
  try {
    const { show: showId, seats, totalAmount, finalAmount, paymentMethod } = req.body;
    const userId = req.user._id;

    if (!showId || !Array.isArray(seats) || seats.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Show ID and seats are required'
      });
    }

    const show = await Show.findById(showId);
    if (!show) {
      return res.status(404).json({
        success: false,
        message: 'Show not found'
      });
    }

    // 🔐 seat availability check
    const seatNumbers = seats.map(s => s.seatNumber);
    const unavailableSeats = seatNumbers.filter(seatNo =>
      show.bookedSeats.some(b => b.seatNumber === seatNo)
    );

    if (unavailableSeats.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Some seats are no longer available',
        unavailableSeats
      });
    }

    const ticketNumber = `TICKET${Date.now()}${Math.floor(Math.random() * 1000)}`;

    const booking = new Booking({
      user: userId,
      show: showId,
      seats,
      ticketNumber,
      totalAmount,
      finalAmount,
      paymentMethod: paymentMethod || 'card',
status: 'pending',
paymentStatus: 'pending'

    });

    const savedBooking = await booking.save();

    // ✅ ONLY correct way to update bookedSeats
    const bookedSeatObjects = seats.map(seat => ({
      seatNumber: seat.seatNumber,
      row: seat.row,
      col: seat.col,
      bookingId: savedBooking._id
    }));

    show.bookedSeats.push(...bookedSeatObjects);
    await show.save();

    const populatedBooking = await Booking.findById(savedBooking._id)
      .populate('user', 'name email phone')
      .populate({
        path: 'show',
        populate: [
          { path: 'movie', select: 'title posterUrl duration language genre' },
          { path: 'theater', select: 'name location screen' }
        ]
      });

    return res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      booking: populatedBooking
    });

  } catch (error) {
    console.error('Create booking error:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


// @desc    Get all bookings (Admin)
// @route   GET /api/admin/bookings
// @access  Admin
// In bookingController.js
exports.getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('user')
      .populate({
        path: 'show',
        populate: ['movie', 'theater']
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      bookings
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bookings'
    });
  }
};


// @desc    Get user bookings
// @route   GET /api/bookings
// @access  Private
exports.getUserBookings = async (req, res) => {
  const bookings = await Booking.find({ user: req.user.id })
    .populate({
      path: 'show',
      populate: [{ path: 'movie' }, { path: 'theater' }]
    });

  res.json({
    success: true,
    bookings
  });
};


// @desc    Get booking by ID
// @route   GET /api/bookings/:id
// @access  Private
exports.getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate({
        path: 'show',
        populate: ['movie', 'theater']
      })
      .populate('user', 'name email phone');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if user owns booking (unless admin)
    if (!req.user.isAdmin && booking.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this booking'
      });
    }

    res.json({
      success: true,
      booking
    });
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Cancel booking
// @route   PUT /api/bookings/:id/cancel
// @access  Private
exports.cancelBooking = async (req, res) => {
  try {
    const { cancellationReason } = req.body;
    const bookingId = req.params.id;

    const booking = await Booking.findById(bookingId)
      .populate("show");

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found"
      });
    }

    if (
      booking.user.toString() !== req.user._id.toString() &&
      !req.user.isAdmin
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to cancel this booking"
      });
    }

   booking.status = 'cancelled';
booking.paymentStatus = 'refunded'; // 🔥 IMPORTANT
booking.finalAmount = 0;            // 🔥 revenue remove

    booking.cancellationReason = cancellationReason;
    booking.cancelledAt = Date.now();

    // ✅ 1. SHOW DATA
    const show = await Show.findById(booking.show._id).populate("theater");

    // ✅ 2. THEATER DATA
    const theater = await Theater.findById(show.theater._id);

    // ✅ 3. FREE THEATER SEATS
    booking.seats.forEach(seat => {
      const screen = theater.screens.find(
        s => s.screenNumber === show.screen
      );

      if (screen && screen.seats[seat.row] && screen.seats[seat.row][seat.col]) {
        screen.seats[seat.row][seat.col].isAvailable = true;
      }
    });

  
// ✅ 4. REMOVE FROM SHOW BOOKED SEATS
show.bookedSeats = show.bookedSeats.filter(
  seat => seat.bookingId.toString() !== bookingId.toString()
);

show.availableSeats = show.totalSeats - show.bookedSeats.length;

// ✅ 🔍 DEBUG LOG (ADD HERE)
console.log("Show booked seats after cancel:", show.bookedSeats);

// ✅ 5. SAVE EVERYTHING
await theater.save();
await show.save();
await booking.save();


    return res.json({
      success: true,
      message: "Booking cancelled successfully",
      booking
    });

  } catch (error) {
    console.error("Cancel booking error:", error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


// @desc    Process payment for booking
// @route   POST /api/bookings/:id/payment
// @access  Private
exports.processPayment = async (req, res) => {
  try {
    const { paymentMethod, transactionId } = req.body;
    const bookingId = req.params.id;

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to process payment for this booking'
      });
    }

    if (booking.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Booking already ${booking.status}`
      });
    }

    booking.status = 'confirmed';
    booking.paymentStatus = 'completed';
    booking.paymentMethod = paymentMethod;
    booking.transactionId = transactionId || `TXN${Date.now()}`;
    booking.paymentId = `PAY${Date.now()}`;

    await booking.save();

    res.json({
      success: true,
      message: 'Payment successful. Booking confirmed!',
      booking
    });

  } catch (error) {
    console.error('Process payment error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


// @desc    Get booking by ticket number
// @route   GET /api/bookings/ticket/:ticketNumber
// @access  Private
exports.getBookingByTicket = async (req, res) => {
  try {
    const { ticketNumber } = req.params;

    const booking = await Booking.findOne({ ticketNumber })
      .populate({
        path: 'show',
        populate: ['movie', 'theater']
      })
      .populate('user', 'name email phone');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if user owns booking (unless admin)
    if (!req.user.isAdmin && booking.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this booking'
      });
    }

    res.json({
      success: true,
      booking
    });
  } catch (error) {
    console.error('Get booking by ticket error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};