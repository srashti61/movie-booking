// server/routes/shows.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Show = require('../models/Show');
const Movie = require('../models/Movie');
const Theater = require('../models/Theater');
const { auth, admin } = require('../middleware/auth'); // keep your auth middleware

// helper: convert date-string (yyyy-mm-dd) to start/end of day
const dayRangeForDate = (dateStr) => {
  const start = new Date(dateStr);
  start.setHours(0,0,0,0);
  const end = new Date(dateStr);
  end.setHours(23,59,59,999);
  return { start, end };
};

// GET show by id
router.get('/:id', async (req, res) => {
  try {
    const show = await Show.findById(req.params.id).populate('movie').populate('theater');
    if (!show) return res.status(404).json({ success: false, message: 'Show not found' });
    return res.json({ success: true, show });
  } catch (err) {
    console.error('Get show error:', err);
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});
router.get('/:id/check-seats', auth, async (req, res) => {
  try {
    const show = await Show.findById(req.params.id).populate('movie', 'title duration').populate('theater', 'name location');
    
    if (!show) {
      return res.status(404).json({ message: 'Show not found' });
    }
    
    const seats = req.query.seats ? req.query.seats.split(',') : [];
    
    if (seats.length === 0) {
      return res.json({
        available: true,
        unavailableSeats: [],
        totalSeats: 0,
        message: 'No seats to check'
      });
    }
    
    const unavailableSeats = [];
    const bookedSeats = show.bookedSeats || [];
    
    for (const seat of seats) {
      if (bookedSeats.includes(seat)) {
        unavailableSeats.push(seat);
      }
    }
    
    res.json({
      available: unavailableSeats.length === 0,
      unavailableSeats,
      totalSeats: seats.length,
      showId: show._id,
      showTime: show.startTime,
      movieTitle: show.movie?.title,
      theaterName: show.theater?.name
    });
  } catch (error) {
    console.error('Error checking seat availability:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error checking seat availability',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// CREATE show (admin)
router.post('/', auth, admin, async (req, res) => {
  try {
    // Expect: movie (id), theater (id), screen (number), date (yyyy-mm-dd), startTime (ISO string), endTime (ISO string), price, totalSeats(optional), seatLayout, isActive
 const {
  movie,
  theater,
  screen,
  date,
  startTime,
  endTime,
  price,
  totalSeats,
  seatsLimit,
  seatCounts,
  seatLayout,
  isActive
} = req.body;


    if (!movie || !theater || !screen || !date || !startTime || !endTime) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // Validate ids
    if (!mongoose.Types.ObjectId.isValid(movie)) return res.status(400).json({ success: false, message: 'Invalid movie id' });
    if (!mongoose.Types.ObjectId.isValid(theater)) return res.status(400).json({ success: false, message: 'Invalid theater id' });

    const movieDoc = await Movie.findById(movie);
    if (!movieDoc) return res.status(404).json({ success: false, message: 'Movie not found' });

    const theaterDoc = await Theater.findById(theater);
    if (!theaterDoc) return res.status(404).json({ success: false, message: 'Theater not found' });

    // find screen in theater (screenNumber must be number)
    const screenNum = Number(screen);
    const screenData = theaterDoc.screens.find(s => Number(s.screenNumber) === screenNum);
    if (!screenData) return res.status(400).json({ success: false, message: `Screen ${screenNum} not found in theater` });

    // parse start/end times into Date objects
    const start = new Date(startTime);
    const end = new Date(endTime);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid startTime or endTime' });
    }
    if (end <= start) return res.status(400).json({ success: false, message: 'endTime must be after startTime' });

    // Overlap check: same theater & same screen & same day
    const { start: dayStart, end: dayEnd } = dayRangeForDate(date);

    const overlapping = await Show.findOne({
      theater: theaterDoc._id,
      screen: screenNum,
      startTime: { $lt: end },   // existing start < new end
      endTime: { $gt: start },   // existing end > new start
      date: { $gte: dayStart, $lte: dayEnd }
    });

    if (overlapping) {
      return res.status(400).json({ success: false, message: 'Show time overlaps with existing show' });
    }

    const seats = Number(totalSeats) || Number(screenData.capacity) || 0;

   const show = new Show({
  movie: movieDoc._id,
  theater: theaterDoc._id,
  screen: screenNum,
  date: new Date(date),
  startTime: start,
  endTime: end,

  totalSeats: seats,
  seatsLimit: Number(seatsLimit) || 0,
  seatCounts: seatCounts || { regular: seats, premium: 0, vip: 0, balcony: 0 },

  price: price || { regular: 0 },
  seatLayout: seatLayout || 'standard',
  isActive: typeof isActive === 'boolean' ? isActive : true
});


    await show.save();

    // push to movie.shows if the field exists
    if (Array.isArray(movieDoc.shows)) {
      movieDoc.shows.push(show._id);
      await movieDoc.save();
    }

    const populatedShow = await Show.findById(show._id).populate('movie').populate('theater');

    return res.status(201).json({ success: true, message: 'Show created successfully', show: populatedShow });
  } catch (err) {
    console.error('Create show error:', err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: 'Validation error', errors: Object.values(err.errors).map(e => e.message) });
    }
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// UPDATE show (admin)
router.put('/:id', auth, admin, async (req, res) => {
  try {
    const showId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(showId)) return res.status(400).json({ success: false, message: 'Invalid show id' });

    const existingShow = await Show.findById(showId);
    if (!existingShow) return res.status(404).json({ success: false, message: 'Show not found' });

  const {
  movie,
  theater,
  screen,
  date,
  startTime,
  endTime,
  price,
  totalSeats,
  seatsLimit,
  seatCounts,
  seatLayout,
  isActive
} = req.body;


    // If changing theater/screen/time, re-validate overlaps
    const newTheater = theater ? theater : existingShow.theater;
    const newScreen = screen ? Number(screen) : existingShow.screen;
    const newStart = startTime ? new Date(startTime) : existingShow.startTime;
    const newEnd = endTime ? new Date(endTime) : existingShow.endTime;
    const newDate = date ? new Date(date) : existingShow.date;

    // Validate ids if provided
    if (movie && !mongoose.Types.ObjectId.isValid(movie)) return res.status(400).json({ success: false, message: 'Invalid movie id' });
    if (theater && !mongoose.Types.ObjectId.isValid(theater)) return res.status(400).json({ success: false, message: 'Invalid theater id' });

    // Overlap check excluding this show id
    const dayStart = new Date(newDate);
    dayStart.setHours(0,0,0,0);
    const dayEnd = new Date(newDate);
    dayEnd.setHours(23,59,59,999);

    const overlapping = await Show.findOne({
      _id: { $ne: existingShow._id },
      theater: newTheater,
      screen: newScreen,
      startTime: { $lt: newEnd },
      endTime: { $gt: newStart },
      date: { $gte: dayStart, $lte: dayEnd }
    });

    if (overlapping) {
      return res.status(400).json({ success: false, message: 'Show time overlaps with existing show' });
    }

    // Apply updates
    existingShow.movie = movie ? movie : existingShow.movie;
    existingShow.theater = theater ? theater : existingShow.theater;
    existingShow.screen = newScreen;
    existingShow.date = newDate;
    existingShow.startTime = newStart;
    existingShow.endTime = newEnd;
  existingShow.price = price ?? existingShow.price;
existingShow.totalSeats = Number(totalSeats) || existingShow.totalSeats;
existingShow.seatsLimit = Number(seatsLimit) || existingShow.seatsLimit;
existingShow.seatCounts = seatCounts || existingShow.seatCounts;
existingShow.seatLayout = seatLayout || existingShow.seatLayout;

    existingShow.isActive = typeof isActive === 'boolean' ? isActive : existingShow.isActive;

    await existingShow.save();

    const populated = await Show.findById(existingShow._id).populate('movie').populate('theater');
    return res.json({ success: true, message: 'Show updated successfully', show: populated });
  } catch (err) {
    console.error('Update show error:', err);
    if (err.name === 'ValidationError') return res.status(400).json({ success: false, message: 'Validation error', errors: Object.values(err.errors).map(e => e.message) });
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// DELETE show
router.delete('/:id', auth, admin, async (req, res) => {
  try {
    const show = await Show.findById(req.params.id);
    if (!show) return res.status(404).json({ success: false, message: 'Show not found' });

    if (show.bookedSeats && show.bookedSeats.length > 0) {
      return res.status(400).json({ success: false, message: 'Cannot delete show with existing bookings' });
    }

    // Remove reference from movie if present
    if (show.movie) {
      await Movie.findByIdAndUpdate(show.movie, { $pull: { shows: show._id } });
    }

    await show.deleteOne();
    return res.json({ success: true, message: 'Show deleted successfully' });
  } catch (err) {
    console.error('Delete show error:', err);
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// GET shows (by date, movie, theater)
router.get('/', async (req, res) => {
  try {
    const { date, movieId, theaterId, city } = req.query;
    const query = { isActive: true };

    if (date) {
      const start = new Date(date);
      start.setHours(0,0,0,0);
      const end = new Date(date);
      end.setHours(23,59,59,999);
      query.date = { $gte: start, $lte: end };
    }
    if (movieId) query.movie = movieId;
    if (theaterId) query.theater = theaterId;

    let showsQuery = Show.find(query).populate('movie').populate('theater').sort('startTime');

    if (city) showsQuery = showsQuery.where('theater.location.city', new RegExp(city, 'i'));

    const shows = await showsQuery;
    return res.json({ success: true, count: shows.length, shows });
  } catch (err) {
    console.error('Get shows error:', err);
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// GET seats for show
router.get('/:id/seats', async (req, res) => {
  try {
    const show = await Show.findById(req.params.id).populate('theater');
    if (!show) return res.status(404).json({ success: false, message: 'Show not found' });

    const theaterScreen = show.theater.screens.find(s => Number(s.screenNumber) === Number(show.screen));
    if (!theaterScreen) return res.status(400).json({ success: false, message: 'Screen not found in theater' });

    // Mark booked seats
    const seats = (theaterScreen.seats || []).map((row, rowIndex) =>
      row.map((seat, colIndex) => ({ ...seat.toObject(), isBooked: show.bookedSeats.some(bs => bs.row === rowIndex && bs.col === colIndex) }))
    );

    return res.json({ success: true, seats, bookedSeats: show.bookedSeats, availableSeats: show.availableSeats, totalSeats: show.totalSeats });
  } catch (err) {
    console.error('Get show seats error:', err);
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

module.exports = router;
