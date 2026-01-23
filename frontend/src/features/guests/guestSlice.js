// frontend/src/features/guests/guestSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import guestService from './guestService';

// ======================
// Initial State
// ======================
const initialState = {
  guests: [],            // all guests
  checkedInGuests: [],   // guests currently checked in
  checkedInRooms: [],    // just the room list from /allguests
  checkedInCount: 0,     // how many are checked in
  lastUpdatedGuest: null, // guest updated by last checkin/checkout

  isError: false,
  isLoading: false,
  isSuccess: false,
  message: '',
};

// Export so hooks can safely fallback
export const initialGuestState = initialState;

// Helper: safely read the auth token from Redux
const getAuthToken = (thunkAPI) => {
  const state = thunkAPI.getState?.() || {};
  const token = state.auth?.clerk?.token;

  if (!token) {
    throw new Error('Not authenticated: missing Clerk token');
  }
  return token;
};

// ======================
// Thunks
// ======================

// Get all guests
export const getAllGuests = createAsyncThunk(
  'guests/getAllGuests',
  async (_, thunkAPI) => {
    try {
      const token = getAuthToken(thunkAPI);
      const result = await guestService.getAllGuests(token);
      return result;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch guests';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Get checked-in guests
export const getCheckedInGuests = createAsyncThunk(
  'guests/getCheckedInGuests',
  async (_, thunkAPI) => {
    try {
      const token = getAuthToken(thunkAPI);
      const result = await guestService.getCheckedInGuests(token);
      return result;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch checked-in guests';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Register guest
export const registerGuest = createAsyncThunk(
  'guests/registerGuest',
  async (guestData, thunkAPI) => {
    try {
      const token = getAuthToken(thunkAPI);
      const result = await guestService.registerGuest(guestData, token);
      return result;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to register guest';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Check-in guest
export const checkInGuest = createAsyncThunk(
  'guests/checkInGuest',
  async (guestId, thunkAPI) => {
    try {
      const token = getAuthToken(thunkAPI);
      const result = await guestService.checkInGuest(guestId, token);
      return result;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to check in guest';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Check-out guest
export const checkOutGuest = createAsyncThunk(
  'guests/checkOutGuest',
  async (guestId, thunkAPI) => {
    try {
      const token = getAuthToken(thunkAPI);
      const result = await guestService.checkOutGuest(guestId, token);
      return result;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to check out guest';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// ======================
// Slice
// ======================

export const guestSlice = createSlice({
  name: 'guests', // CHANGED FROM 'guest' to 'guests' to match store key
  initialState,
  reducers: {
    resetGuest: () => initialState,
    clearGuestError: (state) => {
      state.isError = false;
      state.message = '';
    },
  },
  extraReducers: (builder) => {
    builder
      // ========== getAllGuests ==========
      .addCase(getAllGuests.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.isSuccess = false;
        state.message = '';
      })
      .addCase(getAllGuests.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.isError = false;          

        const payload = action.payload || {};
        
        if (payload.guests && Array.isArray(payload.guests)) {
            state.guests = payload.guests;
        } else if (Array.isArray(payload)) {
            state.guests = payload;
        } else {
            state.guests = [];
        }

        state.message = `Loaded ${state.guests.length} guest(s)`;
        })

      .addCase(getAllGuests.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload || 'Failed to fetch guests';
      })

      // ========== getCheckedInGuests ==========
      .addCase(getCheckedInGuests.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.isSuccess = false;
        state.message = '';
      })
      .addCase(getCheckedInGuests.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.isError = false;   

        const payload = action.payload || {};
        const rooms = payload.rooms || [];
        const guests = payload.guests || [];
        const count = typeof payload.count === 'number' ? payload.count : guests.length;

        state.checkedInGuests = guests;
        state.checkedInRooms = rooms;
        state.checkedInCount = count;
        state.message = `Loaded ${count} checked-in guest(s)`;
        })

      .addCase(getCheckedInGuests.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload || 'Failed to fetch checked-in guests';
      })

      // ========== registerGuest ==========
      .addCase(registerGuest.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.isSuccess = false;
        state.message = '';
      })
      .addCase(registerGuest.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.isError = false;   
        state.message = action.payload?.message || 'Guest registered successfully';
        })
      .addCase(registerGuest.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload || 'Failed to register guest';
      })

      // ========== checkInGuest ==========
      .addCase(checkInGuest.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.isSuccess = false;
        state.message = '';
      })
      .addCase(checkInGuest.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.isError = false; 
        state.lastUpdatedGuest = action.payload || null;
        state.message = action.payload?.message || 'Guest checked in successfully';
        })
      .addCase(checkInGuest.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload || 'Failed to check in guest';
      })

      // ========== checkOutGuest ==========
      .addCase(checkOutGuest.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.isSuccess = false;
        state.message = '';
      })
      .addCase(checkOutGuest.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.isError = false; 
        state.lastUpdatedGuest = action.payload || null;
        state.message = action.payload?.message || 'Guest checked out successfully';
        })
      .addCase(checkOutGuest.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload || 'Failed to check out guest';
      });
  },
});

export const { resetGuest, clearGuestError } = guestSlice.actions;
export default guestSlice.reducer;