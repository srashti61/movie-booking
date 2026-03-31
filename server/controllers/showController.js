// server/controllers/showController.js

const Show = require('../models/Show');
const Movie = require('../models/Movie');
const Theater = require('../models/Theater');

// ------------------------------
// ⭐ Helper: Convert input to Date
// ------------------------------
const toDate = (dateStr, timeStr) => {
  return new Date(`${dateStr}T${timeStr}`);
};

// ------------------------------
// ⭐ GET ALL SHOWS
// ------------------------------
exports.getShows = async (req, res) => {
  try {
    const shows = await Show.find()
      .populate('movie')
      .populate('theater')
      .sort({ startTime: 1 });

    res.json({ success: true, shows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ------------------------------
// ⭐ CHECK OVERLAP
// ------------------------------
exports.checkOverlap = async (req, res) => {
  try {
    const { theaterId, screen, date, startTime, endTime, excludeShowId } = req.body;

    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const query = {
      theater: theaterId,
      screen,
      date: { $gte: dayStart, $lte: dayEnd },
      startTime: { $lt: new Date(endTime) },
      endTime: { $gt: new Date(startTime) },
    };

    if (excludeShowId) query._id = { $ne: excludeShowId };

    const overlappingShow = await Show.findOne(query);

    if (overlappingShow) {
      return res.json({
        success: true,
        overlap: true,
        message: "This show overlaps an existing show.",
        overlappingShow,
      });
    }

    res.json({ success: true, overlap: false });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
};

// ------------------------------
// ⭐ CREATE SHOW (supports single or multiple showtimes)
// ------------------------------
exports.createShow = async (req, res) => {
  try {
    const { movieId, theaterId, screen, date, startTime, endTime, seatsLimit = 0 } = req.body;

    const show = new Show({
      movie: movieId,
      theater: theaterId,
      screen,
      date,
      startTime,
      endTime,
      seatsLimit: seatsLimit > 0 ? seatsLimit : 0,
      price: {
        regular: req.body.regularPrice || 200,
        premium: req.body.premiumPrice || 300,
        vip: req.body.vipPrice || 500
      }
    });

    await show.save();
    
    res.status(201).json({
      success: true,
      message: seatsLimit > 0 
        ? `Show created with ${seatsLimit} seats limit`
        : 'Show created successfully',
      show
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};


// ------------------------------
// ⭐ UPDATE SHOW
// ------------------------------
exports.updateShow = async (req, res) => {
  try {
    const show = await Show.findById(req.params.id);
    if (!show) return res.status(404).json({ success: false, message: "Show not found" });

    Object.assign(show, req.body);

    // Recalculate seats
    show.availableSeats = show.totalSeats - show.bookedSeats.length;

    await show.save();

    res.json({ success: true, message: "Show updated", show });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ------------------------------
// ⭐ DELETE SHOW
// ------------------------------
exports.deleteShow = async (req, res) => {
  try {
    const show = await Show.findById(req.params.id);
    if (!show) return res.status(404).json({ success: false, message: "Show not found" });

    await show.deleteOne();
    res.json({ success: true, message: "Show deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
