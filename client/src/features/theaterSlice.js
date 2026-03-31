import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { theaterAPI } from '../services/api';

export const fetchTheaters = createAsyncThunk(
  'theaters/fetchAll',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { filters } = getState().theaters;

      const params = {
        page: filters.page,
        limit: filters.limit,
        search: filters.search,
        city: filters.city,
        sortBy: filters.sortBy
      };

      const response = await theaterAPI.getAllTheaters(params);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchTheaterShowStats = createAsyncThunk(
  'theaters/fetchShowStats',
  async () => {
    const res = await theaterAPI.get('/theaters/show-stats');
    return res.data.stats;
  }
);

export const fetchTheaterById = createAsyncThunk(
  'theaters/fetchById',
  async (id, { rejectWithValue }) => {
    try {
      return await theaterAPI.getTheaterById(id);
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

export const fetchTheaterShows = createAsyncThunk(
  'theaters/fetchShows',
  async ({ id, params }, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/theaters/${id}/shows?${new URLSearchParams(params)}`);
      return await response.json();
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

const theaterSlice = createSlice({
  name: 'theaters',
initialState: {
  theaters: [],
  currentTheater: null,
  shows: [],
  loading: false,
  error: null,
  filters: {
    page: 1,
    limit: 50,
    search: '',
    city: '',
    amenities: [],
    sortBy: 'createdAt'
  },
  pagination: {
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 1
  }
},

  reducers: {
    clearCurrentTheater: (state) => {
      state.currentTheater = null;
      state.shows = [];
    },
setTheaterFilters: (state, action) => {
  state.filters = {
    ...state.filters,
    ...action.payload,
    page: action.payload.page ?? 1
  };
},

clearTheaterFilters: (state) => {
  state.filters = {
    page: 1,
    limit: 50,
    search: '',
    city: '',
    amenities: [],
    sortBy: 'createdAt'
  };
}

  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTheaters.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
.addCase(fetchTheaters.fulfilled, (state, action) => {
  state.loading = false;
  state.theaters =
    action.payload.data ||
    action.payload.theaters ||
    [];

  state.pagination =
    action.payload.pagination || {
      page: action.payload.page || 1,
      limit: state.filters.limit,
      total: action.payload.total || state.theaters.length,
      totalPages: action.payload.totalPages || 1
    };
})



      .addCase(fetchTheaters.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to fetch theaters';
      })
      .addCase(fetchTheaterById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTheaterById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentTheater = action.payload.theater || action.payload;
      })
      .addCase(fetchTheaterById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to fetch theater';
      })
      .addCase(fetchTheaterShows.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTheaterShows.fulfilled, (state, action) => {
        state.loading = false;
        state.shows = action.payload.shows || [];
      })
      .addCase(fetchTheaterShows.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to fetch shows';
      });
  }
});

export const { clearCurrentTheater, setTheaterFilters, clearTheaterFilters } = theaterSlice.actions;
export default theaterSlice.reducer;