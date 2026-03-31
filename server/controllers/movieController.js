const Movie = require('../models/Movie');
const Show = require('../models/Show');

// @desc    Get all movies (FIXED FOR ADMIN PANEL)
// @route   GET /api/movies
// @access  Public/Admin
// @desc    Get random movies
// @route   GET /api/movies/random
// @access  Public
exports.getRandomMovies = async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 4;

    const movies = await Movie.aggregate([
      { $match: { isActive: { $ne: false } } },
      { $sample: { size: limit } }
    ]);

    res.json({
      success: true,
      movies
    });
  } catch (error) {
    console.error("GET RANDOM MOVIES ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getAllMovies = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      genre,
      language,
      rating,
      sortBy = "createdAt",
      sortOrder = "desc"
    } = req.query;

    const query = {};

    // 🔍 Search (title / description)
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } }
      ];
    }

    // 🎭 Genre filter
    if (genre) {
      query.genre = genre; // array field → Mongo handles it
    }

    // 🌐 Language filter
    if (language) {
      query.language = language;
    }

    // ⭐ Min Rating filter
    if (rating) {
      query.rating = { $gte: Number(rating) };
    }

    const skip = (page - 1) * limit;

    // 📊 Sorting logic
    const sort = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    const movies = await Movie.find(query)
      .sort(sort)                // ✅ SORT
      .skip(skip)                // ✅ PAGINATION
      .limit(Number(limit));     // ✅ PAGINATION

    const total = await Movie.countDocuments(query);

    res.json({
      success: true,
      movies,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("GET MOVIES ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


// @desc    Get movie by ID (FIXED)
// @route   GET /api/movies/:id
// @access  Public
exports.getMovieById = async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id)
      .populate({
        path: 'shows',
        match: { isActive: true },
        populate: [
          { 
            path: 'theater',
            select: 'name location city'
          }
        ]
      });

    if (!movie) {
      return res.status(404).json({
        success: false,
        message: 'Movie not found'
      });
    }

    res.json({
      success: true,
      movie // ✅ Consistent response format
    });
  } catch (error) {
    console.error('Get movie error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Other controller functions remain the same...
// @desc    Create movie
// @route   POST /api/movies
// @access  Private/Admin
exports.createMovie = async (req, res) => {
  try {
    const movie = new Movie(req.body);
    await movie.save();

    res.status(201).json({
      success: true,
      message: 'Movie created successfully',
      movie
    });
  } catch (error) {
    console.error('Create movie error:', error);
    
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
};

// @desc    Update movie
// @route   PUT /api/movies/:id
// @access  Private/Admin
exports.updateMovie = async (req, res) => {
  try {
    const movie = await Movie.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!movie) {
      return res.status(404).json({
        success: false,
        message: 'Movie not found'
      });
    }

    res.json({
      success: true,
      message: 'Movie updated successfully',
      movie
    });
  } catch (error) {
    console.error('Update movie error:', error);
    
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
};

// @desc    Delete movie
// @route   DELETE /api/movies/:id
// @access  Private/Admin
// @desc    Delete movie (PERMANENT)
// @route   DELETE /api/movies/:id
exports.deleteMovie = async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);

    if (!movie) {
      return res.status(404).json({
        success: false,
        message: 'Movie not found'
      });
    }

    await movie.deleteOne(); // ✅ REAL DELETE

    res.json({
      success: true,
      message: 'Movie deleted permanently'
    });
  } catch (error) {
    console.error('Delete movie error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};


// @desc    Get movie shows
// @route   GET /api/movies/:id/shows
// @access  Public
exports.getMovieShows = async (req, res) => {
  try {
    const { date } = req.query;

    const query = {
      movie: req.params.id,
      isActive: true
    };

    // 🟢 TODAY + FUTURE (USING `date` FIELD)
    if (!date) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      query.date = { $gte: today };
    }

    // 🟢 SINGLE DAY FILTER
    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);

      const end = new Date(date);
      end.setHours(23, 59, 59, 999);

      query.date = { $gte: start, $lte: end };
    }

    const shows = await Show.find(query)
      .populate('theater')
      .sort({ date: 1, startTime: 1 });

    res.json({ shows });

  } catch (error) {
    console.error('Get movie shows error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
11





// @desc    Add movie to favorites
// @route   POST /api/movies/:id/favorite
// @access  Private
exports.addToFavorites = async (req, res) => {
  try {
    const user = req.user;
    const movieId = req.params.id;

    // Check if movie exists
    const movie = await Movie.findById(movieId);
    if (!movie) {
      return res.status(404).json({
        success: false,
        message: 'Movie not found'
      });
    }

    // Check if already in favorites
    if (user.favorites.includes(movieId)) {
      return res.status(400).json({
        success: false,
        message: 'Movie already in favorites'
      });
    }

    user.favorites.push(movieId);
    await user.save();

    res.json({
      success: true,
      message: 'Movie added to favorites'
    });
  } catch (error) {
    console.error('Add to favorites error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Remove movie from favorites
// @route   DELETE /api/movies/:id/favorite
// @access  Private
exports.removeFromFavorites = async (req, res) => {
  try {
    const user = req.user;
    const movieId = req.params.id;

    user.favorites = user.favorites.filter(
      fav => fav.toString() !== movieId
    );
    await user.save();

    res.json({
      success: true,
      message: 'Movie removed from favorites'
    });
  } catch (error) {
    console.error('Remove from favorites error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
