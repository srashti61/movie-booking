const express = require('express');
const router = express.Router();
const Theater = require('../models/Theater');
const { auth, admin } = require('../middleware/auth');

// @desc    Get all theaters
// @route   GET /api/theaters
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { city, search, amenities, page = 1, limit = 50 } = req.query;
    
    // Build query
    const query = { isActive: true };
    
    if (city) {
      query['location.city'] = { $regex: city, $options: 'i' };
    }
    
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }
    
    if (amenities) {
      const amenityList = amenities.split(',');
      query.amenities = { $all: amenityList };
    }

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get theaters
    const theaters = await Theater.find(query)
      .sort('name')
      .skip(skip)
      .limit(limitNum);

    const total = await Theater.countDocuments(query);

    res.json({
      success: true,
      count: theaters.length,
      total,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      theaters
    });
  } catch (error) {
    console.error('Get theaters error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Get theater by ID
// @route   GET /api/theaters/:id
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const theater = await Theater.findById(req.params.id);

    if (!theater) {
      return res.status(404).json({
        success: false,
        message: 'Theater not found'
      });
    }

    res.json({
      success: true,
      theater
    });
  } catch (error) {
    console.error('Get theater error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Create theater (Admin only)
// @route   POST /api/theaters
// @access  Private/Admin
router.post('/', auth, admin, async (req, res) => {
  try {
    const theater = new Theater(req.body);
    await theater.save();

    res.status(201).json({
      success: true,
      message: 'Theater created successfully',
      theater
    });
  } catch (error) {
    console.error('Create theater error:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Update theater (Admin only)
// @route   PUT /api/theaters/:id
// @access  Private/Admin
router.put('/:id', auth, admin, async (req, res) => {
  try {
    const theater = await Theater.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!theater) {
      return res.status(404).json({
        success: false,
        message: 'Theater not found'
      });
    }

    res.json({
      success: true,
      message: 'Theater updated successfully',
      theater
    });
  } catch (error) {
    console.error('Update theater error:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Delete theater (Admin only)
// @route   DELETE /api/theaters/:id
// @access  Private/Admin
router.delete('/:id', auth, admin, async (req, res) => {
  try {
    const theater = await Theater.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!theater) {
      return res.status(404).json({
        success: false,
        message: 'Theater not found'
      });
    }

    res.json({
      success: true,
      message: 'Theater deactivated successfully'
    });
  } catch (error) {
    console.error('Delete theater error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Get theater shows
// @route   GET /api/theaters/:id/shows
// @access  Public
router.get('/:id/shows', async (req, res) => {
  try {
    const { date, movieId } = req.query;
    const Show = require('../models/Show');
    
    const query = { theater: req.params.id, isActive: true };
    
    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      
      query.date = { $gte: startDate, $lte: endDate };
    }
    
    if (movieId) {
      query.movie = movieId;
    }

    const shows = await Show.find(query)
      .populate('movie')
      .sort('startTime');

    res.json({
      success: true,
      count: shows.length,
      shows
    });
  } catch (error) {
    console.error('Get theater shows error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Get theater statistics
// @route   GET /api/theaters/:id/stats
// @access  Private/Admin
router.get('/:id/stats', auth, admin, async (req, res) => {
  try {
    const theater = await Theater.findById(req.params.id);
    
    if (!theater) {
      return res.status(404).json({
        success: false,
        message: 'Theater not found'
      });
    }

    const Show = require('../models/Show');
    const Booking = require('../models/Booking');
    
    // Get total shows
    const totalShows = await Show.countDocuments({ theater: req.params.id });
    
    // Get total bookings for this theater
    const shows = await Show.find({ theater: req.params.id }).select('_id');
    const showIds = shows.map(show => show._id);
    
    const totalBookings = await Booking.countDocuments({ show: { $in: showIds } });
    
    // Get revenue
    const bookings = await Booking.find({ show: { $in: showIds } }).select('totalAmount');
    const totalRevenue = bookings.reduce((sum, booking) => sum + booking.totalAmount, 0);
    
    // Get capacity utilization
    let totalCapacity = 0;
    let totalBookedSeats = 0;
    
    for (const show of shows) {
      const showDoc = await Show.findById(show._id).select('totalSeats bookedSeats');
      totalCapacity += showDoc.totalSeats;
      totalBookedSeats += showDoc.bookedSeats.length;
    }
    
    const utilizationRate = totalCapacity > 0 ? (totalBookedSeats / totalCapacity) * 100 : 0;

    res.json({
      success: true,
      stats: {
        theater: {
          name: theater.name,
          screens: theater.screens.length,
          totalCapacity: theater.screens.reduce((sum, screen) => sum + screen.capacity, 0)
        },
        shows: {
          totalShows,
          totalBookings,
          totalRevenue,
          averageRevenuePerShow: totalShows > 0 ? totalRevenue / totalShows : 0
        },
        seats: {
          totalCapacity,
          totalBookedSeats,
          totalAvailableSeats: totalCapacity - totalBookedSeats,
          utilizationRate: utilizationRate.toFixed(2)
        }
      }
    });
  } catch (error) {
    console.error('Get theater stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;