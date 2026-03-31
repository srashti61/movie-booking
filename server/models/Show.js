// server/models/Show.js
const mongoose = require('mongoose');

const bookedSeatSchema = new mongoose.Schema({
  seatNumber: String,
  row: Number,
  col: Number,
  type: String,
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
  bookedAt: { type: Date, default: Date.now }
}, { _id: false });

// ⭐ NEW – seatCounts schema
const seatCountSchema = new mongoose.Schema({
  regular: { type: Number, default: 0 },
  premium: { type: Number, default: 0 },
  vip: { type: Number, default: 0 },
  balcony: { type: Number, default: 0 }
}, { _id: false });

// Backend show.model.js-ல்:
// Add seatsLimit field to show schema
const showSchema = new mongoose.Schema({
  movie: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie', required: true },
  theater: { type: mongoose.Schema.Types.ObjectId, ref: 'Theater', required: true },
  screen: Number,
  date: Date,
  startTime: String,
  endTime: String,

  totalSeats: Number,
  availableSeats: Number,

  seatsLimit: { type: Number, default: 0 },

  seatCounts: {
    regular: Number,
    premium: Number,
    vip: Number,
    balcony: Number
  },

  price: {
    regular: Number,
    premium: Number,
    vip: Number,
    balcony: Number
  },

bookedSeats: [{
  seatNumber: String,
  row: Number,
  col: Number,
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking'
  }
}],


  isActive: { type: Boolean, default: true }
});

// ⭐ AUTO UPDATE available seats + timestamps
showSchema.pre('save', function (next) {
  this.totalSeats = Number(this.totalSeats || 0);

  // auto-calc available seats
  const booked = this.bookedSeats ? this.bookedSeats.length : 0;
  this.availableSeats = Math.max(0, this.totalSeats - booked);

  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Show', showSchema);
