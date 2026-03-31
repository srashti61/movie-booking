const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  duration: { type: Number, required: true, min: 1 },

  genre: [{
    type: String,
    enum: [
      'Action', 'Adventure', 'Animation', 'Comedy', 'Crime',
      'Documentary', 'Drama', 'Family', 'Fantasy', 'History',
      'Horror', 'Music', 'Mystery', 'Romance', 'Sci-Fi',
      'Thriller', 'War', 'Western'
    ]
  }],

  releaseDate: { type: Date, required: true },

  posterUrl: {
    type: String,
    default: 'https://via.placeholder.com/300x450?text=Movie+Poster'
  },

  trailerUrl: String,

  bannerUrl: {
    type: String,
    default: 'https://via.placeholder.com/1200x400?text=Movie+Banner'
  },

  rating: { type: Number, min: 0, max: 10, default: 0 },
  totalRatings: { type: Number, default: 0 },

  language: { type: String, default: 'English', required: true },

  cast: [{
    name: String,
    character: String,
    imageUrl: String
  }],

  director: String,
  producer: String,
  writers: [String],

  isActive: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false },

  shows: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Show' }],

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }

});

movieSchema.pre(['save', 'findOneAndUpdate'], function(next) {
  this.set({ updatedAt: Date.now() });
  next();
});

movieSchema.virtual('formattedDuration').get(function() {
  const hours = Math.floor(this.duration / 60);
  const minutes = this.duration % 60;
  return `${hours}h ${minutes}m`;
});

movieSchema.virtual('formattedReleaseDate').get(function () {
  if (!this.releaseDate) return null;

  return this.releaseDate.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
});


movieSchema.set('toJSON', { virtuals: true });
movieSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Movie', movieSchema);
