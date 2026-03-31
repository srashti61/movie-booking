const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
user: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'User',
  required: true
},

  show: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Show',
    required: [true, 'Show is required']
  },
  seats: [{
    seatNumber: {
      type: String,
      required: [true, 'Seat number is required']
    },
    row: {
      type: Number,
      required: [true, 'Row is required']
    },
    col: {
      type: Number,
      required: [true, 'Column is required']
    },
type: {
  type: String,
  enum: ['regular', 'premium', 'vip', 'balcony'], // ✅ ADD THIS
  required: true
},

    price: {
      type: Number,
      required: [true, 'Seat price is required']
    }
  }],
ticketNumber: {
  type: String,
  unique: true
},

  totalAmount: {
    type: Number,
    required: [true, 'Total amount is required'],
    min: [0, 'Total amount cannot be negative']
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  
paymentMethod: {
  type: String,
  enum: ['card', 'upi', 'netbanking', 'wallet'],
  default: 'upi'
},
gstAmount: {
  type: Number,
  default: 0
},
finalAmount: {        // ✅ Base + GST (FINAL AMOUNT)
  type: Number,
  required: true
},

  transactionId: String,
  paymentId: String,
  cancellationReason: String,
  cancelledAt: Date,
  bookingDate: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Generate ticket number before saving
bookingSchema.pre('save', async function(next) {
  if (!this.ticketNumber) {
    const prefix = 'TICKET';
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    this.ticketNumber = `${prefix}${randomNum}`;
  }
  next();
});

// Update timestamp
bookingSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Booking', bookingSchema);