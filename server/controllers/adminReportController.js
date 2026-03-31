const Booking = require('../models/Booking');
const Show = require('../models/Show');
const Movie = require('../models/Movie');
const Theater = require('../models/Theater');
const User = require('../models/User');
const mongoose = require('mongoose');


// ================= SUMMARY =================
exports.getReportSummary = async (req, res) => {
  try {
    const { startDate, endDate, theater, movie, reportType } = req.query;

    const start = new Date(startDate);
    const end = new Date(endDate);

    const baseMatch = {
      createdAt: { $gte: start, $lte: end }
    };

    // ✅ New Users (for users report also)
    const newUsers = await User.countDocuments({
      createdAt: { $gte: start, $lte: end }
    });

    // ================= USERS REPORT =================
    if (reportType === 'users') {
      return res.json({
  totalRevenue: revenueAgg[0]?.totalRevenue || 0,
  totalBookings,
  newUsers,
  occupancyRate: 0 // temporary (real calc later)
});

    }

    // ================= BOOKINGS / SALES =================
    const revenueMatch = {
      ...baseMatch,
      status: { $ne: 'cancelled' },
      paymentStatus: 'completed'
    };

    const bookingMatch = { ...baseMatch };

    const pipeline = [
      { $match: revenueMatch },
      {
        $lookup: {
          from: 'shows',
          localField: 'show',
          foreignField: '_id',
          as: 'show'
        }
      },
      { $unwind: '$show' }
    ];

    if (theater && theater !== 'all') {
      pipeline.push({
        $match: { 'show.theater': new mongoose.Types.ObjectId(theater) }
      });
    }

    if (movie && movie !== 'all') {
      pipeline.push({
        $match: { 'show.movie': new mongoose.Types.ObjectId(movie) }
      });
    }

    pipeline.push({
      $group: {
        _id: null,
        totalRevenue: {
          $sum: { $ifNull: ['$finalAmount', '$totalAmount'] }
        }
      }
    });

    const revenueAgg = await Booking.aggregate(pipeline);
    const totalBookings = await Booking.countDocuments(bookingMatch);

    res.json({
      totalRevenue: revenueAgg[0]?.totalRevenue || 0,
      totalBookings,
      newUsers
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Report summary failed' });
  }
};



exports.getDashboardStats = async (req, res) => {
  try {
    const today = getDateRange('today');
    const week = getDateRange('week');
    const month = getDateRange('month');

    const calc = async ({ start, end }) => {
      const r = await Booking.aggregate([
        {
          $match: {
            createdAt: { $gte: start, $lte: end },
            status: { $ne: 'cancelled' }
          }
        },
        {
          $group: {
            _id: null,
            revenue: {
              $sum: { $ifNull: ['$finalAmount', '$totalAmount'] }
            },
            bookings: { $sum: 1 }
          }
        }
      ]);
      return r[0] || { revenue: 0, bookings: 0 };
    };

    const [
      totalMovies,
      totalTheaters,
      totalUsers,
      totalBookings,
      pendingBookings,
      todayStats,
      weekStats,
      monthStats
    ] = await Promise.all([
      Movie.countDocuments({}),
      Theater.countDocuments({}),
      User.countDocuments({}),
      Booking.countDocuments({ status: { $ne: 'cancelled' } }),
      Booking.countDocuments({ status: 'pending' }),
      calc(today),
      calc(week),
      calc(month)
    ]);

    res.json({
      totalMovies,
      totalTheaters,
      totalUsers,
      totalBookings,
      pendingBookings,
      todayRevenue: todayStats.revenue,
      weeklyRevenue: weekStats.revenue,
      monthlyRevenue: monthStats.revenue,
      todayBookings: todayStats.bookings
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Dashboard failed' });
  }
};

// ================= DETAILED =================
exports.getDetailed = async (req, res) => {
  try {
    const { startDate, endDate, theater, movie, reportType } = req.query;

    // ================= USERS REPORT =================
    if (reportType === 'users') {
      const users = await User.find({
        createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) }
      });

      return res.json(
        users.map(u => ({
          movie: '-',
          theater: '-',
          bookings: 0,
          revenue: 0,
          occupancy: 0,
          avgTicketPrice: 0,
          date: u.createdAt.toISOString().slice(0, 10)
        }))
      );
    }

    const match = {
      createdAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    };

    const pipeline = [
      { $match: match },
      {
        $lookup: {
          from: 'shows',
          localField: 'show',
          foreignField: '_id',
          as: 'show'
        }
      },
      { $unwind: '$show' },
      {
        $lookup: {
          from: 'movies',
          localField: 'show.movie',
          foreignField: '_id',
          as: 'movie'
        }
      },
      { $unwind: '$movie' },
      {
        $lookup: {
          from: 'theaters',
          localField: 'show.theater',
          foreignField: '_id',
          as: 'theater'
        }
      },
      { $unwind: '$theater' }
    ];

    if (theater && theater !== 'all') {
      pipeline.push({
        $match: { 'theater._id': new mongoose.Types.ObjectId(theater) }
      });
    }

    if (movie && movie !== 'all') {
      pipeline.push({
        $match: { 'movie._id': new mongoose.Types.ObjectId(movie) }
      });
    }

    pipeline.push({
      $project: {
        movie: '$movie.title',
        theater: '$theater.name',
        bookings: { $size: '$seats' },
        revenue: { $ifNull: ['$finalAmount', '$totalAmount'] },
        date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }
      }
    });

    const data = await Booking.aggregate(pipeline);
    res.json(data);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Detailed report failed' });
  }
};




// ================= CHART =================
exports.getChart = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const startRange = startDate ? new Date(startDate) : new Date();
    const endRange = endDate ? new Date(endDate) : new Date();

    startRange.setHours(0, 0, 0, 0);
    endRange.setHours(23, 59, 59, 999);

    const labels = [];
    const revenue = [];
    const bookings = [];

    const days =
      Math.ceil((endRange - startRange) / (1000 * 60 * 60 * 24)) || 1;

    for (let i = 0; i < days; i++) {
      const dayStart = new Date(startRange);
      dayStart.setDate(dayStart.getDate() + i);

      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);

const daily = await Booking.find({
  createdAt: { $gte: dayStart, $lte: dayEnd },
  status: { $ne: 'cancelled' },
  paymentStatus: 'completed'
});


      labels.push(
        dayStart.toLocaleDateString('en-US', { weekday: 'short' })
      );

      revenue.push(
        daily.reduce(
          (s, b) => s + (b.finalAmount || b.totalAmount || 0),
          0
        )
      );

      bookings.push(daily.length);
    }

    res.json({
      labels,
      datasets: [
        { label: 'Revenue', data: revenue },
        { label: 'Bookings', data: bookings }
      ]
    });
  } catch (err) {
    console.error('Chart report error:', err);
    res.status(500).json({ message: 'Chart report failed' });
  }
};

