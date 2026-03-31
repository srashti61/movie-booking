// Validation functions
export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validatePhone = (phone) => {
  const re = /^[0-9]{10}$/;
  return re.test(phone);
};

export const validatePassword = (password) => {
  return password.length >= 6;
};

export const validateName = (name) => {
  return name.trim().length >= 2;
};

// Form validation schemas
export const registerSchema = {
  name: {
    required: 'Name is required',
    validate: (value) => validateName(value) || 'Name must be at least 2 characters'
  },
  email: {
    required: 'Email is required',
    validate: (value) => validateEmail(value) || 'Please enter a valid email'
  },
  password: {
    required: 'Password is required',
    validate: (value) => validatePassword(value) || 'Password must be at least 6 characters'
  },
  phone: {
    required: 'Phone number is required',
    validate: (value) => validatePhone(value) || 'Please enter a valid 10-digit phone number'
  }
};

export const loginSchema = {
  email: {
    required: 'Email is required',
    validate: (value) => validateEmail(value) || 'Please enter a valid email'
  },
  password: {
    required: 'Password is required'
  }
};

// Seat validation
export const validateSeatSelection = (seats, maxSeats = 10) => {
  if (seats.length === 0) {
    return 'Please select at least one seat';
  }
  
  if (seats.length > maxSeats) {
    return `Maximum ${maxSeats} seats per booking`;
  }
  
  return null;
};