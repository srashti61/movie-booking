const Booking = require('../models/Booking');
const Show = require('../models/Show');
const User = require('../models/User');
const Movie = require('../models/Movie');

exports.getSummary = async (req, res) => {
  try {
    const { startDate, endDate, theater, movie } = req.query;

    const query = {
      createdAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    };

    const bookings = await Booking.find(query)
      .populate({
        path: 'show',
        populate: ['movie', 'theater']
      });

    const filtered = bookings.filter(b => {
      if (theater !== 'all' && b.show?.theater?._id.toString() !== theater) {
        return false;
      }
      if (movie !== 'all' && b.show?.movie?._id.toString() !== movie) {
        return false;
      }
      return true;
    });

    const totalRevenue = filtered.reduce(
      (sum, b) => sum + (b.finalAmount || 0), 0
    );

    res.json({
      totalRevenue,
      totalBookings: filtered.length
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Summary report failed' });
  }
};


exports.getDetailed = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate({
        path: 'show',
        populate: ['movie', 'theater']
      });

    const rows = bookings.map((b, i) => ({
      id: i + 1,
      movie: b.show?.movie?.title || 'N/A',
      theater: b.show?.theater?.name || 'N/A',
      bookings: b.seats.length,
      revenue: b.finalAmount || 0,
      occupancy: 70,
      avgTicketPrice: b.finalAmount / b.seats.length,
      date: b.createdAt.toISOString().split('T')[0]
    }));

    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Detailed report failed' });
  }
};
exports.getReportSummary = async (req, res) => {
  try {
    const { reportType, startDate, endDate } = req.query;

    const match = {
      status: { $in: ['confirmed', 'completed'] }
    };

    if (startDate && endDate) {
      match.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // ================= SALES =================
    if (reportType === 'sales') {
      const bookings = await Booking.find(match);

      return res.json({
        totalRevenue: bookings.reduce((s, b) => s + (b.finalAmount || 0), 0),
        totalBookings: bookings.length
      });
    }

    // ================= BOOKINGS =================
    if (reportType === 'bookings') {
      const bookings = await Booking.find(match);

      return res.json({
        totalBookings: bookings.length,
        confirmed: bookings.filter(b => b.status === 'confirmed').length,
        cancelled: await Booking.countDocuments({ status: 'cancelled' })
      });
    }

    // ================= USERS =================
    if (reportType === 'users') {
      return res.json({
        totalUsers: await User.countDocuments()
      });
    }

    // ================= MOVIES =================
    if (reportType === 'movies') {
      const data = await Booking.aggregate([
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
          $group: {
            _id: '$movie.title',
            totalBookings: { $sum: 1 },
            revenue: { $sum: '$finalAmount' }
          }
        }
      ]);

      return res.json(data);
    }

    // ================= THEATERS =================
    if (reportType === 'theaters') {
      const data = await Booking.aggregate([
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
            from: 'theaters',
            localField: 'show.theater',
            foreignField: '_id',
            as: 'theater'
          }
        },
        { $unwind: '$theater' },
        {
          $group: {
            _id: '$theater.name',
            totalBookings: { $sum: 1 },
            revenue: { $sum: '$finalAmount' }
          }
        }
      ]);

      return res.json(data);
    }

    res.json({});
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Report summary failed' });
  }
};

exports.getReportChart = async (req, res) => {
  try {
    const labels = [];
    const revenue = [];
    const bookings = [];

    for (let i = 6; i >= 0; i--) {
      const start = new Date();
      start.setDate(start.getDate() - i);
      start.setHours(0, 0, 0, 0);

      const end = new Date(start);
      end.setHours(23, 59, 59, 999);

      const dayBookings = await Booking.find({
        status: { $in: ['confirmed', 'completed'] },
        createdAt: { $gte: start, $lte: end }
      });

      labels.push(start.toLocaleDateString('en-US', { weekday: 'short' }));
      bookings.push(dayBookings.length);
      revenue.push(dayBookings.reduce((s, b) => s + (b.finalAmount || 0), 0));
    }

    res.json({
      labels,
      datasets: [
        { label: 'Revenue', data: revenue },
        { label: 'Bookings', data: bookings }
      ]
    });
  } catch (err) {
    res.status(500).json({ message: 'Chart report failed' });
  }
};

exports.getChart = async (req, res) => {
  try {
    const days = [];
    const revenue = [];
    const bookings = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const day = date.toLocaleDateString('en-US', { weekday: 'short' });

      const dayBookings = await Booking.find({
        createdAt: {
          $gte: new Date(date.setHours(0,0,0,0)),
          $lte: new Date(date.setHours(23,59,59,999))
        }
      });

      days.push(day);
      bookings.push(dayBookings.length);
      revenue.push(dayBookings.reduce((s,b)=>s+(b.finalAmount||0),0));
    }

    res.json({
      labels: days,
      datasets: [
        { label: 'Revenue', data: revenue },
        { label: 'Bookings', data: bookings }
      ]
    });
  } catch (err) {
    res.status(500).json({ message: 'Chart report failed' });
  }
};
