import { configureStore } from '@reduxjs/toolkit';
import authReducer from './features/authSlice';
import movieReducer from './features/movieSlice';
import bookingReducer from './features/bookingSlice';
import theaterReducer from './features/theaterSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    movies: movieReducer,
    bookings: bookingReducer,
    theaters: theaterReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['booking/create/fulfilled'],
        // Ignore these field paths in the state
        ignoredPaths: ['bookings.currentBooking.show.startTime', 'bookings.currentBooking.show.endTime']
      },
    }),
  devTools: process.env.NODE_ENV !== 'production'
});

export default store;