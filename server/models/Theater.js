const mongoose = require('mongoose');

const theaterSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Theater name is required'],
    trim: true
  },
  location: {
    address: {
      type: String,
      required: [true, 'Address is required']
    },
    city: {
      type: String,
      required: [true, 'City is required']
    },
    state: {
      type: String,
      required: [true, 'State is required']
    },
    zipCode: {
      type: String,
      required: [true, 'ZIP code is required']
    },
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  screens: [{
    screenNumber: {
      type: Number,
      required: [true, 'Screen number is required'],
      min: [1, 'Screen number must be at least 1']
    },
    screenName: String,
    capacity: {
      type: Number,
      required: [true, 'Capacity is required'],
      min: [1, 'Capacity must be at least 1']
    },
    screenType: {
      type: String,
      enum: ['Standard', 'IMAX', '4DX', 'Dolby', 'VIP'],
      default: 'Standard'
    },
    seats: [[{
      seatNumber: {
        type: String,
        required: [true, 'Seat number is required']
      },
      row: {
        type: Number,
        required: [true, 'Row number is required']
      },
      col: {
        type: Number,
        required: [true, 'Column number is required']
      },
      type: {
        type: String,
        enum: ['regular', 'premium', 'vip'],
        default: 'regular'
      },
      price: {
        type: Number,
        required: [true, 'Price is required'],
        min: [0, 'Price cannot be negative']
      },
      isAvailable: {
        type: Boolean,
        default: true
      }
    }]]
  }],
  amenities: [{
    type: String,
    enum: [
      'Dolby Atmos', 'IMAX', '3D', '4DX', 'Food Court',
      'Parking', 'Wheelchair Access', 'VIP Lounge',
      'Online Booking', 'Mobile Tickets', 'Cafeteria',
      'Play Area', 'Free WiFi', 'ATM', 'Restaurant'
    ]
  }],
  contact: {
    phone: {
      type: String,
      required: [true, 'Phone number is required']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true
    }
  },
  openingHours: {
    weekdays: {
      open: { type: String, default: '10:00' },
      close: { type: String, default: '23:00' }
    },
    weekends: {
      open: { type: String, default: '09:00' },
      close: { type: String, default: '00:00' }
    }
  },
  isActive: {
    type: Boolean,
    default: true
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

// Generate seats for a screen
theaterSchema.methods.generateSeats = function(rows, cols, screenIndex) {
  const seats = [];
  const rowLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  
  for (let row = 0; row < rows; row++) {
    const seatRow = [];
    for (let col = 0; col < cols; col++) {
      const seatNumber = `${rowLetters[row]}${col + 1}`;
      let type = 'regular';
      let price = 200;
      
      if (row < 2) {
        type = 'vip';
        price = 400;
      } else if (row < 5) {
        type = 'premium';
        price = 300;
      }
      
      seatRow.push({
        seatNumber,
        row,
        col,
        type,
        price,
        isAvailable: true
      });
    }
    seats.push(seatRow);
  }
  
  if (this.screens[screenIndex]) {
    this.screens[screenIndex].seats = seats;
    this.screens[screenIndex].capacity = rows * cols;
  }
  
  return this;
};

module.exports = mongoose.model('Theater', theaterSchema);