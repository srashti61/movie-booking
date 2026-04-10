// services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  headers: { 'Content-Type': 'application/json' }
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);


export const authAPI = {
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },
  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  },
  updateProfile: async (profileData) => {
    const response = await api.put('/auth/profile', profileData);
    return response.data;
  },
   changePassword: async (data) => {
    const response = await api.put('/auth/change-password', data);
    return response.data;
  }
};

export const reviewAPI = {
  addReview: (data) => api.post("/api/reviews", data),
  getReviews: (movieId) => api.get(`/api/reviews/${movieId}`),
};

export const movieAPI = {
  uploadImage: (form) =>
    api.post("/movies/upload", form, {
      headers: {
        "Content-Type": "multipart/form-data"
      }
    }),

  getAllMovies: async () => {
    const response = await api.get('/movies');
    return response.data;
  },

  getMovieById: async (id) => {
    const response = await api.get(`/movies/${id}`);
    return response.data;
  },

getMovieShows: async (id, params) => {
  const response = await api.get(`/movies/${id}/shows`, {
    params
  });
  return response.data;
},

  createMovie: async (movieData) => {
    const response = await api.post('/movies', movieData);
    return response.data;
  },

  updateMovie: async (id, movieData) => {
    const response = await api.put(`/movies/${id}`, movieData);
    return response.data;
  },

  deleteMovie: async (id) => {
    const response = await api.delete(`/movies/${id}`);
    return response.data;
  }
};

export const theaterAPI = {
getAllTheaters: async (params) => {
  const res = await api.get('/theaters', { params });
  return res.data;   // ✅ THIS IS MUST
},

  getTheaterById: async (id) => {
    const response = await api.get(`/theaters/${id}`);
    return response.data;
  },
  createTheater: async (theaterData) => {
    const response = await api.post('/theaters', theaterData);
    return response.data;
  },
  updateTheater: async (id, theaterData) => {
    const response = await api.put(`/theaters/${id}`, theaterData);
    return response.data;
  },
  deleteTheater: async (id) => {
    const response = await api.delete(`/theaters/${id}`);
    return response.data;
  }
};

export const showAPI = {
  getAllShows: async () => {
    const response = await api.get('/shows');
    return response.data;
  },
  getShowById: async (id) => {
    const response = await api.get(`/shows/${id}`);
    return response.data;
  },
  getShowsByMovie: async (movieId) => {
    const response = await api.get(`/shows/movie/${movieId}`);
    return response.data;
  },
  getShowsByTheater: async (theaterId) => {
    const response = await api.get(`/shows/theater/${theaterId}`);
    return response.data;
  },
  createShow: async (showData) => {
    const response = await api.post('/shows', showData);
    return response.data;
  },
  updateShow: async (id, showData) => {
    const response = await api.put(`/shows/${id}`, showData);
    return response.data;
  },
  deleteShow: async (id) => {
    const response = await api.delete(`/shows/${id}`);
    return response.data;
  },
  // ✅ Check seat availability
  checkSeatAvailability: async (showId, seatNumbers) => {
    const response = await api.get(`/shows/${showId}/check-seats`, {
      params: { seats: seatNumbers.join(',') }
    });
    return response.data;
  }
};

export const bookingAPI = {
  getUserBookings: async () => {
    const res = await api.get('/bookings');
    return res.data;
  },

  getAllBookings: async () => {
    const res = await api.get('/bookings/all');
    return res.data;
  },

  getBookingById: async (id) => {
    const res = await api.get(`/bookings/${id}`);
    return res.data;
  },

  createBooking: async (data) => {
    const res = await api.post('/bookings', data);
    return res.data;
  },

  processPayment: async (id, data) => {
    const res = await api.post(`/bookings/${id}/payment`, data);
    return res.data;
  },

  cancelBooking: async (id, reason) => {
    const res = await api.put(`/bookings/${id}/cancel`, {
      cancellationReason: reason
    });
    return res.data;
  }
};


export const userAPI = {
  getAllUsers: async () => {
    const response = await api.get('/users');
    return response.data;
  },
  getUserById: async (id) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },
  updateUser: async (id, userData) => {
    const response = await api.put(`/users/${id}`, userData);
    return response.data;
  },
  deleteUser: async (id) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  }
};

export const adminAPI = {
  getReportSummary: (params) =>
    api.get('/admin/reports/summary', { params }),

  getReportDetailed: (params) =>
    api.get('/admin/reports/detailed', { params }),

  getReportChart: (params) =>
    api.get('/admin/reports/chart', { params }),

  getTheaters: () =>
    api.get('/admin/theaters'),

  getMovies: () =>
    api.get('/admin/movies'),
};


// For development - mock data fallbacks
export const mockAPI = {
  getMockBookings: () => {
    return [
      {
        _id: 'booking_1',
        ticketNumber: 'TICKET10001',
        user: {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+911234567890'
        },
        show: {
          _id: 'show_1',
          movie: {
            title: 'Avengers: Endgame',
            posterUrl: 'https://via.placeholder.com/300x450?text=Avengers'
          },
          theater: {
            name: 'PVR Cinemas',
            location: { city: 'Mumbai' }
          },
          screen: 1,
          date: new Date(Date.now() + 86400000), // Tomorrow
          startTime: new Date(Date.now() + 86400000 + 36000000) // Tomorrow 10 AM
        },
        seats: [
          { seatNumber: 'A1', type: 'regular', price: 200 },
          { seatNumber: 'A2', type: 'regular', price: 200 }
        ],
        totalAmount: 400,
        finalAmount: 472, // with GST
        status: 'confirmed',
        paymentStatus: 'completed',
        paymentMethod: 'upi',
        bookingDate: new Date()
      }
    ];
  }
};

export default api;