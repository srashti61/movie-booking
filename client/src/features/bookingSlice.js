import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { bookingAPI } from '../services/api';

export const createBooking = createAsyncThunk(
  'bookings/create',
  async (bookingData, thunkAPI) => {
    try {
      const res = await bookingAPI.createBooking(bookingData);
      return res;
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || 'Booking failed'
      );
    }
  }
);



export const fetchUserBookings = createAsyncThunk(
  'bookings/fetchAll',
  async (params, { rejectWithValue }) => {
    try {
      return await bookingAPI.getUserBookings(params);
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

export const fetchBookingById = createAsyncThunk(
  'bookings/fetchById',
  async (id, { rejectWithValue }) => {
    try {
      return await bookingAPI.getBookingById(id);
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

export const cancelBooking = createAsyncThunk(
  'bookings/cancel',
  async ({ id, reason }, { rejectWithValue }) => {
    try {
      return await bookingAPI.cancelBooking(id, reason);
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

export const processPayment = createAsyncThunk(
  'bookings/payment',
  async ({ id, paymentData }, { rejectWithValue }) => {
    try {
      return await bookingAPI.processPayment(id, paymentData);
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

const bookingSlice = createSlice({
  name: 'bookings',
  initialState: {
    bookings: [],
    currentBooking: null,
    loading: false,
    error: null,
    success: false,
    pagination: {
      page: 1,
      totalPages: 1,
      total: 0
    }
  },
  reducers: {
    clearCurrentBooking: (state) => {
      state.currentBooking = null;
    },
    clearBookingError: (state) => {
      state.error = null;
    },
    clearBookingSuccess: (state) => {
      state.success = false;
    },
    setBookingStatus: (state, action) => {
      if (state.currentBooking) {
        state.currentBooking.status = action.payload.status;
        if (action.payload.paymentStatus) {
          state.currentBooking.paymentStatus = action.payload.paymentStatus;
        }
      }
    }
  },
  extraReducers: (builder) => {
    builder
      
      .addCase(createBooking.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(createBooking.fulfilled, (state, action) => {
        state.loading = false;
        state.currentBooking = action.payload.booking;
        state.success = true;
       
        state.bookings.unshift(action.payload.booking);
      })
      .addCase(createBooking.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to create booking';
        state.success = false;
      })
      
      .addCase(fetchUserBookings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserBookings.fulfilled, (state, action) => {
        state.loading = false;
        state.bookings = action.payload.bookings;
        state.pagination = {
          page: action.payload.currentPage,
          totalPages: action.payload.totalPages,
          total: action.payload.total
        };
      })
      .addCase(fetchUserBookings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to fetch bookings';
      })
      
      .addCase(fetchBookingById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBookingById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentBooking = action.payload.booking;
      })
      .addCase(fetchBookingById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to fetch booking';
      })
      
      .addCase(cancelBooking.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(cancelBooking.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        const index = state.bookings.findIndex(b => b._id === action.payload.booking._id);
        if (index !== -1) {
          state.bookings[index] = action.payload.booking;
        }
        if (state.currentBooking && state.currentBooking._id === action.payload.booking._id) {
          state.currentBooking = action.payload.booking;
        }
      })
      .addCase(cancelBooking.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to cancel booking';
        state.success = false;
      })
  
      .addCase(processPayment.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(processPayment.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        if (state.currentBooking) {
          state.currentBooking = action.payload.booking;
        }
      })
      .addCase(processPayment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Payment failed';
        state.success = false;
      });
  }
});

export const { clearCurrentBooking, clearBookingError, clearBookingSuccess, setBookingStatus } = bookingSlice.actions;
export default bookingSlice.reducer;