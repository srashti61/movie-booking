import axios from 'axios';
import api from './api';

export const adminAPI = {
  getReportSummary: (params) =>
    api.get('/admin/reports/summary', { params }),

  getReportDetailed: (params) =>
    api.get('/admin/reports/detailed', { params }),

  getReportChart: (params) =>
    api.get('/admin/reports/chart', { params }),

  getTheaters: () =>
    api.get('/admin/reports/filters/theaters'),

  getMovies: () =>
    api.get('/admin/reports/filters/movies'),
};

// ✅ Dashboard Stats - USE api INSTANCE (WITH TOKEN)
const getDashboardStats = async () => {
  const { data } = await api.get('/admin/dashboard/stats');
  return data.stats; // backend { success, stats }
};

// ✅ Recent Bookings - USE api INSTANCE (WITH TOKEN)
const getRecentBookings = async (params = {}) => {
  const { data } = await api.get('/admin/bookings/recent', { params });
  return data;
};

// ✅ Recent Users - USE api INSTANCE (WITH TOKEN)
const getRecentUsers = async (params = {}) => {
  const { data } = await api.get('/admin/users/recent', { params });
  return data;
};

// ✅ Chart Data - USE api INSTANCE (WITH TOKEN)
const getChartData = async (days = 7) => {
  const { data } = await api.get('/admin/chart-data', { params: { days } });
  return data.chartData;
};

// ✅ Theater Performance - USE api INSTANCE (WITH TOKEN)
const getTheaterPerformance = async () => {
  const { data } = await api.get('/admin/theater-performance');
  return data.theaterPerformance || [];
};

// ✅ Movie Performance - USE api INSTANCE (WITH TOKEN)
const getMoviePerformance = async () => {
  const { data } = await api.get('/admin/movie-performance');
  return data.moviePerformance || [];
};

// ✅ Revenue Distribution - USE api INSTANCE (WITH TOKEN)
const getRevenueDistribution = async () => {
  const { data } = await api.get('/admin/revenue-distribution');
  return data.revenueDistribution;
};

export default {
  getDashboardStats,
  getRecentBookings,
  getRecentUsers,
  getChartData,
  getTheaterPerformance,
  getMoviePerformance,
  getRevenueDistribution
};

// ✅ Movie API functions (should use api instance with token)
const uploadImage = (formData) =>
  api.post("/admin/movies/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  }).then(res => res.data);

// Create movie
const createMovie = (data) =>
  api.post("/admin/movies", data).then(res => res.data);

// Update movie
const updateMovie = (id, data) =>
  api.put(`/admin/movies/${id}`, data).then(res => res.data);

// Delete movie
const deleteMovie = (id) =>
  api.delete(`/admin/movies/${id}`).then(res => res.data);

// Get movies
const fetchAllMovies = () =>
  api.get("/admin/movies").then(res => res.data);

export const movieAPI = {
  uploadImage,
  createMovie,
  updateMovie,
  deleteMovie,
  fetchAllMovies
};