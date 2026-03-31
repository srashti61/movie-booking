import { useSelector, useDispatch } from 'react-redux';
import { useEffect } from 'react';
import { fetchMovies, setFilters } from '../features/movieSlice';

export const useMovies = (initialFilters = {}) => {
  const dispatch = useDispatch();
  const { movies, loading, error, filters, pagination } = useSelector(state => state.movies);

  useEffect(() => {
    if (initialFilters && Object.keys(initialFilters).length > 0) {
      dispatch(setFilters(initialFilters));
    }
  }, [dispatch, initialFilters]);

  useEffect(() => {
    dispatch(fetchMovies(filters));
  }, [dispatch, filters]);

  const updateFilters = (newFilters) => {
    dispatch(setFilters(newFilters));
  };

  const clearAllFilters = () => {
    dispatch(setFilters({
      search: '',
      genre: '',
      language: '',
      rating: '',
      sortBy: 'releaseDate',
      sortOrder: 'desc'
    }));
  };

  return {
    movies,
    loading,
    error,
    filters,
    pagination,
    updateFilters,
    clearAllFilters
  };
};