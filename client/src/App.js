import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import { ToastContainer } from 'react-toastify';
import { Provider, useDispatch } from 'react-redux';
import store from './store';
import { getProfile } from './features/authSlice';

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

// ✅ Admin Routes
import AdminRoutes from './routes/admin';

// Pages
import Home from './pages/Home';
import Movies from './pages/Movies';
import MovieDetails from './pages/MovieDetails';
import Theaters from './pages/Theaters';
import TheaterDetails from './pages/TheaterDetails';
import Booking from './pages/Booking';
import BookingConfirmation from './pages/BookingConfirmation';
import MyBookings from './pages/MyBookings';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';

// Styles
import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';

// ✅ Initialize Auth
const InitializeAuth = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      dispatch(getProfile());
    }
  }, [dispatch]);

  return null;
};

// ✅ App Layout with Conditional Navbar/Footer
const AppLayout = () => {
  const location = useLocation();

  // ✅ Admin pages detection
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <div className="App d-flex flex-column min-vh-100">
      <InitializeAuth />

      {/* ✅ Hide Navbar on Admin Pages */}
      {!isAdminRoute && <Navbar />}

      <main className="flex-grow-1">
        <Container fluid className="p-0">

          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/movies" element={<Movies />} />
            <Route path="/movies/:id" element={<MovieDetails />} />
            <Route path="/theaters" element={<Theaters />} />
            <Route path="/theaters/:id" element={<TheaterDetails />} />

            {/* Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected Routes */}
            <Route path="/booking/:showId" element={
              <ProtectedRoute>
                <Booking />
              </ProtectedRoute>
            } />
            <Route path="/booking-confirmation/:bookingId" element={
              <ProtectedRoute>
                <BookingConfirmation />
              </ProtectedRoute>
            } />
            <Route path="/my-bookings" element={
              <ProtectedRoute>
                <MyBookings />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />

            {/* ✅ Admin Routes */}
            <Route path="/admin/*" element={
              <ProtectedRoute requireAdmin>
                <AdminRoutes />
              </ProtectedRoute>
            } />

            {/* 404 */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Container>
      </main>

      {/* ✅ Hide Footer on Admin Pages */}
      {!isAdminRoute && <Footer />}

      <ToastContainer position="bottom-right" autoClose={3001} />
    </div>
  );
};

// ✅ Main App Wrapper
const App = () => {
  return (
    <Provider store={store}>
      <Router>
        <AppLayout />
      </Router>
    </Provider>
  );
};

export default App;
