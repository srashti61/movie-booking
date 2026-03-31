import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

import api, { movieAPI } from '../services/api';

const extractError = (error) => {
  if (error?.response?.data?.message) return error.response.data.message;
  if (error?.response?.data) return JSON.stringify(error.response.data);
  if (error?.message) return error.message;
  return 'Network error occurred';
};
export const fetchMovies = createAsyncThunk(
  'movies/fetchMovies',
  async (filters) => {
    const res = await api.get('/movies', {
      params: filters
    });
    return res.data;
  }
);
export const fetchMovieShows = createAsyncThunk(
  'movies/fetchShows',
  async ({ movieId, date }, { rejectWithValue }) => {
    try {
      const res = await api.get(`/movies/${movieId}/shows`, {
        params: { date }
      });
      return res.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: 'Failed to fetch shows' }
      );
    }
  }
);

export const fetchMovieById = createAsyncThunk(
  'movies/fetchById',
  async (id, { rejectWithValue }) => {
    try {
      const res = await api.get(`/movies/${id}`);

      const movie = res.data?.movie || res.data;

      if (!movie) {
        throw new Error('Movie not found');
      }

      return { movie };

    } catch (error) {
      return rejectWithValue({
        message: extractError(error)
      });
    }
  }
);

export const createMovie = createAsyncThunk(
  'movies/create',
  async (movieData, { rejectWithValue }) => {
    try {
      const res = await movieAPI.createMovie(movieData);
      return { movie: res.movie || res, message: 'Movie created successfully' };
    } catch (error) {
      return rejectWithValue({ message: extractError(error) });
    }
  }
);

export const updateMovie = createAsyncThunk(
  'movies/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await movieAPI.updateMovie(id, data);
      return { movie: res.movie || res, message: 'Movie updated successfully' };
    } catch (error) {
      return rejectWithValue({ message: extractError(error) });
    }
  }
);

export const deleteMovie = createAsyncThunk(
  'movies/delete',
  async (id, { rejectWithValue }) => {
    try {
      await movieAPI.deleteMovie(id);
      return { id, message: 'Movie deleted successfully' };
    } catch (error) {
      return rejectWithValue({ message: extractError(error) });
    }
  }
);

const initialState = {

  movies: [],
  currentMovie: null,
  shows: [],
  favorites: [],
  
  loading: false,
  error: null,
  operationSuccess: false,
  operationMessage: '',
  
  pagination: {
    page: 1,
    totalPages: 1,
    total: 0,
    limit: 12
  },
  
  filters: {
    search: '',
    genre: '',
    language: '',
    rating: '',
    isActive: null, 
    isFeatured: null,
    sortBy: 'releaseDate',
    sortOrder: 'desc',
    page: 1,
    limit: 12
  }
};

const movieSlice = createSlice({
  name: 'movies',
  initialState,
  reducers: {
  
    clearCurrentMovie: (state) => {
      state.currentMovie = null;
      state.shows = [];
      state.error = null;
    },
    
    clearOperationStatus: (state) => {
      state.operationSuccess = false;
      state.operationMessage = '';
      state.error = null;
    },
    
setFilters: (state, action) => {
  state.filters = {
    ...state.filters,
    ...action.payload,
    page:
      action.payload.page !== undefined
        ? action.payload.page
        : 1
  };
},

    clearFilters: (state) => {
      state.filters = initialState.filters;
    },
    
    setFavorites: (state, action) => {
      state.favorites = Array.isArray(action.payload) ? action.payload : [];
    },
    
    updateMovieInList: (state, action) => {
      const { id, updates } = action.payload;
      const index = state.movies.findIndex(m => m._id === id);
      if (index !== -1) {
        state.movies[index] = { ...state.movies[index], ...updates };
      }
    }
  },
  
  extraReducers: (builder) => {
    builder
   
      .addCase(fetchMovies.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
.addCase(fetchMovies.fulfilled, (state, action) => {
  state.loading = false;

  state.movies = action.payload.movies || [];

  state.pagination = {
    ...state.pagination,
    ...action.payload.pagination,
    page: action.meta.arg?.page || 1  
  };

  state.error = null;
})

.addCase(fetchMovieShows.pending, (state) => {
  state.loading = true;
})

.addCase(fetchMovieShows.fulfilled, (state, action) => {
  state.loading = false;
  state.shows = action.payload.shows || [];
})

.addCase(fetchMovieShows.rejected, (state, action) => {
  state.loading = false;
  state.shows = [];
  state.error = action.payload?.message || 'Failed to load shows';
})


      .addCase(fetchMovies.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to fetch movies';
        state.movies = [];
      })

      .addCase(createMovie.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.operationSuccess = false;
      })
      .addCase(createMovie.fulfilled, (state, action) => {
        state.loading = false;
        state.operationSuccess = true;
        state.operationMessage = action.payload.message;
        
        if (action.payload.movie) {
          state.movies = [action.payload.movie, ...state.movies];
          state.pagination.total += 1;
        }
      })
      .addCase(createMovie.rejected, (state, action) => {
        state.loading = false;
        state.operationSuccess = false;
        state.error = action.payload?.message || 'Failed to create movie';
      })
    
.addCase(fetchMovieById.fulfilled, (state, action) => {
  state.loading = false;
  state.currentMovie = action.payload.movie; 
  state.error = null;
})

.addCase(fetchMovieById.rejected, (state, action) => {
  state.loading = false;
  state.currentMovie = null;
  state.error = action.payload?.message || 'Failed to load movie';
})

      .addCase(updateMovie.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateMovie.fulfilled, (state, action) => {
        state.loading = false;
        state.operationSuccess = true;
        state.operationMessage = action.payload.message;
        
        const { movie: updatedMovie } = action.payload;
        if (updatedMovie) {
          const index = state.movies.findIndex(m => m._id === updatedMovie._id);
          if (index !== -1) {
            state.movies[index] = updatedMovie;
          }
          if (state.currentMovie && state.currentMovie._id === updatedMovie._id) {
            state.currentMovie = updatedMovie;
          }
        }
      })
      .addCase(updateMovie.rejected, (state, action) => {
        state.loading = false;
        state.operationSuccess = false;
        state.error = action.payload?.message || 'Failed to update movie';
      })
      
      .addCase(deleteMovie.fulfilled, (state, action) => {
        state.operationSuccess = true;
        state.operationMessage = action.payload.message;
        state.movies = state.movies.filter(m => m._id !== action.payload.id);
        state.pagination.total -= 1;
      })
      .addCase(deleteMovie.rejected, (state, action) => {
        state.operationSuccess = false;
        state.error = action.payload?.message || 'Failed to delete movie';
      });
  }
});

export const {
  clearCurrentMovie,
  clearOperationStatus,
  setFilters,
  clearFilters,
  setFavorites,
  updateMovieInList
} = movieSlice.actions;

export default movieSlice.reducer;