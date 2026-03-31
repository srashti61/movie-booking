const express = require('express');
const router = express.Router();

const adminController = require('../controllers/adminController');
const reportController = require('../controllers/adminReportController');
const { auth } = require('../middleware/auth');

// ✅ ADD THESE IMPORTS
const Theater = require('../models/Theater');
const Movie = require('../models/Movie');

// ==============================
// 📊 DASHBOARD ROUTES (Protected)
// ==============================

router.get('/dashboard/stats', auth, adminController.getDashboardStats);
router.get('/bookings/recent', auth, adminController.getRecentBookings);
router.get('/users/recent', auth, adminController.getRecentUsers);
router.get('/chart-data', auth, adminController.getChartData);
router.get('/theater-performance', auth, adminController.getTheaterPerformance);
router.get('/movie-performance', auth, adminController.getMoviePerformance);
router.get('/revenue-distribution', auth, adminController.getRevenueDistribution);

// ==============================
// 📊 REPORT ROUTES
// ==============================

router.get('/reports/summary', auth, reportController.getReportSummary);
router.get('/reports/detailed', auth, reportController.getDetailed);
router.get('/reports/chart', auth, reportController.getChart);

// ==============================
// ✅ API TEST ROUTE
// ==============================

router.get('/test', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Admin API is working!',
    timestamp: new Date().toISOString()
  });
});

// 🔹 FILTER DROPDOWNS
// 🎭 THEATER FILTER
router.get('/theaters', auth, async (req, res) => {
  try {
    const theaters = await Theater.find().select('name');
    res.json(theaters);
  } catch (e) {
    res.status(500).json({ message: 'Failed to load theaters' });
  }
});

// 🎬 MOVIE FILTER
router.get('/movies', auth, async (req, res) => {
  try {
    const movies = await Movie.find().select('title');
    res.json(movies);
  } catch (e) {
    res.status(500).json({ message: 'Failed to load movies' });
  }
});

module.exports = router;
