// server.js - payment route add செய்யவும்
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

// Initialize Express
const app = express();

// Middleware
app.use(cors({
  origin: "https://movie-booking-vn6i.vercel.app",
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/movie-booking', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('✅ MongoDB connected successfully'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Import routes
const authRoutes = require('./routes/auth');
const movieRoutes = require('./routes/movies');
const theaterRoutes = require('./routes/theaters');
const showRoutes = require('./routes/shows');
const bookingRoutes = require('./routes/bookings');
const userRoutes = require('./routes/users');
const paymentRoutes = require('./routes/payments'); // ✅ Add this line
const reviewRoutes = require("./routes/reviewRoutes");



// Check if adminRoutes exists, use test version if not
// Admin Routes
let adminRoutes;
try {
  adminRoutes = require('./routes/adminRoutes');   // load real admin routes
  console.log('✅ Admin routes loaded');
} catch (error) {
  console.warn('⚠️ Admin routes not found — using test routes');

  const testRouter = express.Router();

  testRouter.get('/', (req, res) => {
    res.json({ message: 'Admin API test route working' });
  });

  testRouter.get('/dashboard', (req, res) => {
    res.json({
      totalMovies: 4,
      totalTheaters: 3,
      totalUsers: 10,
      totalBookings: 25,
      todayRevenue: 5000,
      pendingBookings: 2
    });
  });

  adminRoutes = testRouter;
}

// Register routes
app.use('/api/auth', authRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/theaters', theaterRoutes);
app.use('/api/shows', showRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/users', userRoutes);
app.use('/api/payments', paymentRoutes); // ✅ Add this line
app.use("/api/reviews", reviewRoutes);
app.use('/api/admin', adminRoutes);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ... rest of the server.js code ...

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Welcome route
app.get('/api', (req, res) => {
  res.json({
    message: '🎬 Welcome to Movie Ticket Booking API',
    version: '1.0.0',
    documentation: 'Available endpoints below',
    endpoints: {
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        profile: 'GET /api/auth/profile'
      },
      movies: {
        getAll: 'GET /api/movies',
        getById: 'GET /api/movies/:id',
        getShows: 'GET /api/movies/:id/shows'
      },
      theaters: 'GET /api/theaters',
      shows: 'GET /api/shows',
      bookings: 'GET /api/bookings (requires auth)',
      users: 'GET /api/users (admin only)',
      admin: 'GET /api/admin (admin only)'
    }
  });
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Start server
const PORT = process.env.PORT || 5001;
const server = app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🌐 API Base URL: http://localhost:${PORT}/api`);
  console.log(`📚 Available endpoints:`);
  console.log(`   http://localhost:${PORT}/api/health`);
  console.log(`   http://localhost:${PORT}/api/movies`);
  console.log(`   http://localhost:${PORT}/api/auth/login`);
  console.log(`   http://localhost:${PORT}/api/admin`);
  console.log(`\n🎬 Try these test endpoints:`);
  console.log(`   GET  http://localhost:${PORT}/api/movies`);
  console.log(`   POST http://localhost:${PORT}/api/auth/login`);
  console.log(`   POST http://localhost:${PORT}/api/auth/register`);
  console.log(`   GET  http://localhost:${PORT}/api/admin`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Process terminated.');
    process.exit(0);
  });
});
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

module.exports = app;