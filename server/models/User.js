// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters']
  },

  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },

  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },

  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number']
  },

  // ✅ ADMIN ROLE
  isAdmin: {
    type: Boolean,
    default: false
  },

  // ✅ ADDED FIELDS (IMPORTANT)
  gender: {
    type: String,
    enum: ['male', 'female', 'other', 'prefer-not-to-say'],
    default: 'male'
  },

  dateOfBirth: {
    type: Date,
    default: null
  },

  bookings: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking'
  }],

  favorites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Movie'
  }],

  profileImage: {
    type: String,
    default: 'https://ui-avatars.com/api/?name=User&background=random'
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


// HASH PASSWORD
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});


// UPDATE TIME
userSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});


// COMPARE PASSWORD
userSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};


// JWT TOKEN
userSchema.methods.generateAuthToken = function () {
  return jwt.sign(
    {
      userId: this._id,
      email: this.email,
      isAdmin: this.isAdmin
    },
    process.env.JWT_SECRET || 'your_jwt_secret_key',
    { expiresIn: '7d' }
  );
};


// REMOVE PASSWORD
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
