// Movie genres
export const MOVIE_GENRES = [
  'Action', 'Adventure', 'Animation', 'Comedy', 'Crime',
  'Documentary', 'Drama', 'Family', 'Fantasy', 'History',
  'Horror', 'Music', 'Mystery', 'Romance', 'Sci-Fi',
  'Thriller', 'War', 'Western'
];

// Languages
export const LANGUAGES = [
  'English',
  'Hindi',
  'Tamil',
  'Telugu',
  'Kannada',
  'Malayalam',
  'Bengali',
  'Marathi',
  'Gujarati',
  'Punjabi'
];

// Theater amenities
export const THEATER_AMENITIES = [
  'Dolby Atmos',
  'IMAX',
  '3D',
  '4DX',
  'Food Court',
  'Parking',
  'Wheelchair Access',
  'VIP Lounge',
  'Online Booking',
  'Mobile Tickets',
  'Cafeteria',
  'Play Area',
  'Free WiFi',
  'ATM',
  'Restaurant'
];

// Seat types and colors
export const SEAT_TYPES = {
  REGULAR: 'regular',
  PREMIUM: 'premium',
  VIP: 'vip'
};

export const SEAT_TYPE_COLORS = {
  regular: '#198754', // Green
  premium: '#0d6efd', // Blue
  vip: '#dc3545'      // Red
};

// Booking status
export const BOOKING_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed'
};

// Payment methods
export const PAYMENT_METHODS = [
  { id: 'card', name: 'Credit/Debit Card', icon: 'fa-credit-card' },
  { id: 'upi', name: 'UPI', icon: 'fa-mobile-alt' },
  { id: 'netbanking', name: 'Net Banking', icon: 'fa-university' },
  { id: 'wallet', name: 'Wallet', icon: 'fa-wallet' }
];

// Screen types
export const SCREEN_TYPES = [
  'Standard',
  'IMAX',
  '4DX',
  'Dolby',
  'VIP'
];

// Cities for theaters
export const CITIES = [
  'Bangalore',
  'Mumbai',
  'Delhi',
  'Chennai',
  'Kolkata',
  'Hyderabad',
  'Pune',
  'Ahmedabad'
];

// Helper functions
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0
  }).format(amount);
};

export const formatDate = (date, format = 'dd MMM yyyy') => {
  const { format: dateFormat } = require('date-fns');
  return dateFormat(new Date(date), format);
};

export const formatTime = (time) => {
  const { format } = require('date-fns');
  return format(new Date(time), 'h:mm a');
};

export const getStatusColor = (status) => {
  switch(status) {
    case 'confirmed':
    case 'completed':
      return 'success';
    case 'pending':
      return 'warning';
    case 'cancelled':
      return 'danger';
    default:
      return 'secondary';
  }
};

export const getPaymentStatusColor = (status) => {
  switch(status) {
    case 'completed':
      return 'success';
    case 'pending':
      return 'warning';
    case 'failed':
      return 'danger';
    case 'refunded':
      return 'info';
    default:
      return 'secondary';
  }
};