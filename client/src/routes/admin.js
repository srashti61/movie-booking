import React from 'react';
import { Routes, Route } from 'react-router-dom';

// Admin Pages
import AdminDashboard from '../pages/admin/Dashboard';
import MovieManagement from '../pages/admin/MovieManagement';
import TheaterManagement from '../pages/admin/TheaterManagement';
import ShowManagement from '../pages/admin/ShowManagement';
import UserManagement from '../pages/admin/UserManagement';
import BookingManagement from '../pages/admin/BookingManagement';
import Reports from '../pages/admin/Reports';
import Settings from '../pages/admin/Settings';

const AdminRoutes = () => {
  return (
    <Routes>
      {/* Dashboard */}
      <Route index element={<AdminDashboard />} />

      {/* ✅ MOVIE ROUTES */}
      <Route path="movies" element={<MovieManagement />} />
      <Route path="movies/new" element={<MovieManagement />} />
      <Route path="movies/:id/edit" element={<MovieManagement />} />

      {/* ✅ THEATER ROUTES */}
      <Route path="theaters" element={<TheaterManagement />} />
      <Route path="theaters/new" element={<TheaterManagement />} />

      {/* ✅ SHOW ROUTES */}
      <Route path="shows" element={<ShowManagement />} />
      <Route path="shows/new" element={<ShowManagement />} />

      {/* ✅ OTHER MODULES */}
      <Route path="users" element={<UserManagement />} />
      <Route path="bookings" element={<BookingManagement />} />
      <Route path="reports" element={<Reports />} />
      <Route path="settings" element={<Settings />} />
    </Routes>
  );
};

export default AdminRoutes;
