const Booking = require('../models/Booking');
const Movie = require('../models/Movie');
const Theater = require('../models/Theater');
const User = require('../models/User');
const Show = require('../models/Show');

// @desc    Get dashboard statistics
// @route   GET /api/admin/dashboard/stats
// @access  Private/Admin
exports.getDashboardStats = async (req, res) => {
  try {
    console.log('Fetching dashboard stats...');

    // Get counts
    const [
      totalMovies,
      totalTheaters,
      totalUsers,
      totalBookings
    ] = await Promise.all([
      Movie.countDocuments({ isActive: true }),
      Theater.countDocuments({ isActive: true }),
      User.countDocuments({}),
Booking.countDocuments({})

    ]);

    // Get today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get today's bookings and revenue
    const revenueExpr = {
      $sum: {
        $ifNull: ['$finalAmount', '$totalAmount']
      }
    };

    // Today stats
    const todayStats = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: today, $lt: tomorrow },
          status: { $ne: 'cancelled' },
          paymentStatus: 'completed'
        }

      },
      {
        $group: {
          _id: null,
          bookings: { $sum: 1 },
          revenue: revenueExpr
        }
      }
    ]);


const pendingBookings = await Booking.countDocuments({
  status: { $in: ['pending', 'cancelled'] }
});




    // Get weekly revenue (last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const weeklyStats = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: weekAgo },
          status: { $ne: 'cancelled' },
          paymentStatus: 'completed'
        }

      },
      {
        $group: {
          _id: null,
          revenue: revenueExpr
        }
      }
    ]);

    // Get monthly revenue (last 30 days)
  // ✅ Get monthly revenue (CURRENT MONTH)
const monthStart = new Date();
monthStart.setDate(1);
monthStart.setHours(0, 0, 0, 0);

const monthEnd = new Date();
monthEnd.setHours(23, 59, 59, 999);

const monthlyStats = await Booking.aggregate([
  {
    $match: {
      createdAt: { $gte: monthStart, $lte: monthEnd },
      status: { $ne: 'cancelled' },
      paymentStatus: 'completed'
    }
  },
  {
    $group: {
      _id: null,
      revenue: {
        $sum: {
          $ifNull: ['$finalAmount', '$totalAmount']
        }
      }
    }
  }
]);


    const stats = {
      totalMovies,
      totalTheaters,
      totalUsers,
      totalBookings,
      todayRevenue: todayStats[0]?.revenue || 0,
      todayBookings: todayStats[0]?.bookings || 0,
      pendingBookings,
      weeklyRevenue: weeklyStats[0]?.revenue || 0,
      monthlyRevenue: monthlyStats[0]?.revenue || 0
    };

    console.log('Dashboard stats:', stats);
    res.json({ success: true, stats });

  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get recent bookings
// @route   GET /api/admin/bookings/recent
// @access  Private/Admin
exports.getRecentBookings = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const bookings = await Booking.find()
      .populate('user', 'name email')
      .populate({
        path: 'show',
        populate: [
          { path: 'movie', select: 'title posterUrl' },
          { path: 'theater', select: 'name' }
        ]
      })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean(); // ✅ IMPORTANT: converts mongoose doc to plain object

    // ✅ SAFETY FIX: Ensure createdAt always exists
    const safeBookings = bookings.map(b => ({
      ...b,
      createdAt: b.createdAt || new Date() // fallback date
    }));

    res.json({ success: true, bookings: safeBookings });

  } catch (error) {
    console.error('Get recent bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};


// @desc    Get recent users
// @route   GET /api/admin/users/recent
// @access  Private/Admin
exports.getRecentUsers = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const users = await User.find()
      .select('name email phone isAdmin createdAt')
      .sort('-createdAt')
      .limit(limit);

    res.json({ success: true, users });

  } catch (error) {
    console.error('Get recent users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
// ✅ Theater Performance
exports.getTheaterPerformance = async (req, res) => {
  try {
    const data = await Booking.aggregate([
      {
        $group: {
          _id: "$show",
          totalBookings: { $sum: 1 },
          totalRevenue: { $sum: "$totalAmount" }
        }
      },
      { $sort: { totalBookings: -1 } }
    ]);

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Movie Performance
exports.getMoviePerformance = async (req, res) => {
  try {
    const data = await Booking.aggregate([
      {
        $lookup: {
          from: "shows",
          localField: "show",
          foreignField: "_id",
          as: "showData"
        }
      },
      { $unwind: "$showData" },
      {
        $group: {
          _id: "$showData.movie",
          totalBookings: { $sum: 1 },
          totalRevenue: { $sum: "$totalAmount" }
        }
      },
      { $sort: { totalBookings: -1 } }
    ]);

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get chart data
// @route   GET /api/admin/chart-data
// @access  Private/Admin
exports.getChartData = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const chartData = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const dayStats = await Booking.aggregate([
        {
$match: {
  createdAt: { $gte: date, $lt: nextDate },
  status: { $ne: 'cancelled' },
  paymentStatus: 'completed'   // ✅ ADD THIS
}

        },
        {
          $group: {
            _id: null,
            bookings: { $sum: 1 },
            // again use finalAmount
            revenue: {
              $sum: {
                $ifNull: ['$finalAmount', '$totalAmount']
              }
            }

          }
        }
      ]);

      const userStats = await User.aggregate([
        {
          $match: {
            createdAt: { $gte: date, $lt: nextDate }
          }
        },
        {
          $group: {
            _id: null,
            count: { $sum: 1 }
          }
        }
      ]);

      chartData.push({
        date: date.toISOString().split('T')[0],
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        bookings: dayStats[0]?.bookings || 0,
        revenue: dayStats[0]?.revenue || 0,
        newUsers: userStats[0]?.count || 0
      });
    }

    res.json({ success: true, chartData });
  } catch (error) {
    console.error('Get chart data error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Revenue distribution by seat type
// @route   GET /api/admin/revenue-distribution
// @access  Private/Admin
exports.getRevenueDistribution = async (req, res) => {
  try {
    const result = await Booking.aggregate([
      {
        $match: {
          status: { $ne: 'cancelled' }
        }
      },
      { $unwind: '$seats' },
      {
        $group: {
          _id: '$seats.type',          // 'regular' | 'premium' | 'vip'
          revenue: { $sum: '$seats.price' }
        }
      }
    ]);

    let regular = 0, premium = 0, vip = 0;

    result.forEach(item => {
      if (item._id === 'regular') regular = item.revenue;
      if (item._id === 'premium') premium = item.revenue;
      if (item._id === 'vip') vip = item.revenue;
    });

    const totalRevenue = regular + premium + vip;

    const toPerc = (val) =>
      totalRevenue ? Math.round((val / totalRevenue) * 100) : 0;

    const distribution = {
      totalRevenue,
      regular: { revenue: regular, percentage: toPerc(regular) },
      premium: { revenue: premium, percentage: toPerc(premium) },
      vip: { revenue: vip, percentage: toPerc(vip) }
    };

    res.json({ success: true, revenueDistribution: distribution });
  } catch (error) {
    console.error('Get revenue distribution error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// ✅ CHANGE PASSWORD (MOVE OUTSIDE)
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.userId).select('+password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
      return res.status(400).json({ message: 'Current password incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password changed successfully' });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
