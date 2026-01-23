// frontend/src/features/residents/residentSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import residentService from './residentService';

// ==============================
// Initial State
// ==============================
const initialState = {
  residents: [],
  selectedResidents: [],    // For residents by room
  guestsByHost: [],         // Normalized guests associated with a host
  guestsStatsByHost: null,  // Optional stats object from backend

  isLoading: false,
  isError: false,
  isSuccess: false,
  message: '',
};

// Helper: safely read the auth token from Redux
const getAuthToken = (thunkAPI) => {
  const state = thunkAPI.getState?.() || {};
  const token = state.auth?.clerk?.token;

  if (!token) {
    throw new Error('No authentication token found');
  }
  return token;
};

// ==============================
// Thunks
// ==============================

// Get resident(s) by room number
export const getResidentByRoom = createAsyncThunk(
  'residents/getByRoom',
  async (roomNumber, thunkAPI) => {
    try {
      const token = getAuthToken(thunkAPI);

      const formattedRoom = roomNumber.trim().toUpperCase();
      console.log('[getResidentByRoom thunk] formattedRoom:', formattedRoom);

      const res = await residentService.getResidentByRoom(formattedRoom, token);
      console.log(
        '[getResidentByRoom thunk] service response type:',
        Array.isArray(res) ? 'array' : typeof res,
        'length:',
        Array.isArray(res) ? res.length : undefined
      );

      return res;
    } catch (error) {
      console.error('[getResidentByRoom thunk] error:', error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to fetch residents';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Get guests by host ID
export const getGuestsByHost = createAsyncThunk(
  'residents/getGuestsByHost',
  async (hostId, thunkAPI) => {
    try {
      const token = getAuthToken(thunkAPI);

      console.log('[getGuestsByHost thunk] hostId:', hostId);

      const res = await residentService.getGuestsByHost(hostId, token);
      console.log('[getGuestsByHost thunk] service raw response:', res);

      // Normalize backend response into:
      // { guestNames: [{ id, name, lastRoom }, ...] }
      let rawGuestArray = [];

      if (Array.isArray(res?.guestNames)) {
        rawGuestArray = res.guestNames;
      } else if (Array.isArray(res?.guests)) {
        rawGuestArray = res.guests;
      } else if (Array.isArray(res)) {
        rawGuestArray = res;
      } else {
        rawGuestArray = [];
      }

      const guestNames = rawGuestArray.map((g) => ({
        id: g.id || g._id, // support either id or _id
        name: g.name || '',
        lastRoom: g.lastRoom || g.room || g.hostRoom || null,
      }));

      return {
        guestNames,
        stats: res?.stats || null,
      };
    } catch (error) {
      console.error('[getGuestsByHost thunk] error:', error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to fetch guests';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Get all residents
export const getAllResidents = createAsyncThunk(
  'residents/getAll',
  async (_, thunkAPI) => {
    try {
      const token = getAuthToken(thunkAPI);

      console.log('[getAllResidents thunk] fetching all residents');
      const res = await residentService.getAllResidents(token);
      console.log(
        '[getAllResidents thunk] response type:',
        Array.isArray(res) ? 'array' : typeof res,
        'length:',
        Array.isArray(res) ? res.length : undefined
      );

      return res;
    } catch (error) {
      console.error('[getAllResidents thunk] error:', error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to fetch all residents';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// ==============================
// Slice
// ==============================
export const residentSlice = createSlice({
  name: 'resident',
  initialState,
  reducers: {
    resetResident: () => initialState,
    clearSelectedResidents: (state) => {
      state.selectedResidents = [];
      state.guestsByHost = [];
      state.guestsStatsByHost = null;
      state.message = '';
      state.isError = false;
    },
    clearError: (state) => {
      state.message = '';
      state.isError = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // =========================
      // Get Resident by Room
      // =========================
      .addCase(getResidentByRoom.pending, (state) => {
        console.log('[residentSlice] getResidentByRoom.pending');
        state.isLoading = true;
        state.isError = false;
        state.isSuccess = false;
        state.message = '';
        state.selectedResidents = [];
      })
      .addCase(getResidentByRoom.fulfilled, (state, action) => {
        console.log(
          '[residentSlice] getResidentByRoom.fulfilled payload:',
          action.payload
        );
        state.isLoading = false;
        state.isSuccess = true;

        if (Array.isArray(action.payload)) {
          state.selectedResidents = action.payload;
        } else if (action.payload) {
          state.selectedResidents = [action.payload];
        } else {
          state.selectedResidents = [];
        }

        const count = state.selectedResidents.length;
        state.message = count
          ? `Found ${count} resident(s)`
          : 'No residents found';
      })
      .addCase(getResidentByRoom.rejected, (state, action) => {
        console.log(
          '[residentSlice] getResidentByRoom.rejected payload:',
          action.payload
        );
        state.isLoading = false;
        state.isError = true;
        state.isSuccess = false;
        state.selectedResidents = [];
        state.message = action.payload || 'Failed to fetch residents';
      })

      // =========================
      // Get Guests by Host
      // =========================
      .addCase(getGuestsByHost.pending, (state) => {
        console.log('[residentSlice] getGuestsByHost.pending');
        state.isLoading = true;
        state.isError = false;
        state.isSuccess = false;
        state.message = '';
        state.guestsByHost = [];
        state.guestsStatsByHost = null;
      })
      .addCase(getGuestsByHost.fulfilled, (state, action) => {
        console.log(
          '[residentSlice] getGuestsByHost.fulfilled payload:',
          action.payload
        );
        state.isLoading = false;
        state.isSuccess = true;

        const payload = action.payload || {};

        if (Array.isArray(payload.guests)) {
          state.guestsByHost = payload.guests;
        } else if (Array.isArray(payload.guestNames)) {
          state.guestsByHost = payload.guestNames;
        } else if (Array.isArray(payload)) {
          state.guestsByHost = payload;
        } else {
          state.guestsByHost = [];
        }

        state.guestsStatsByHost = payload.stats || null;

        state.message = state.guestsByHost.length
          ? `Found ${state.guestsByHost.length} guest(s)`
          : 'No guests found';
      })
      .addCase(getGuestsByHost.rejected, (state, action) => {
        console.log(
          '[residentSlice] getGuestsByHost.rejected payload:',
          action.payload
        );
        state.isLoading = false;
        state.isError = true;
        state.isSuccess = false;
        state.guestsByHost = [];
        state.guestsStatsByHost = null;
        state.message = action.payload || 'Failed to fetch guests';
      })

      // =========================
      // Get All Residents
      // =========================
      .addCase(getAllResidents.pending, (state) => {
        console.log('[residentSlice] getAllResidents.pending');
        state.isLoading = true;
        state.isError = false;
        state.isSuccess = false;
        state.message = '';
      })
      .addCase(getAllResidents.fulfilled, (state, action) => {
        console.log(
          '[residentSlice] getAllResidents.fulfilled payload:',
          action.payload
        );
        state.isLoading = false;
        state.isSuccess = true;

        state.residents = Array.isArray(action.payload)
          ? action.payload
          : [];

        state.message = `Loaded ${state.residents.length} resident(s)`;
      })
      .addCase(getAllResidents.rejected, (state, action) => {
        console.log(
          '[residentSlice] getAllResidents.rejected payload:',
          action.payload
        );
        state.isLoading = false;
        state.isError = true;
        state.isSuccess = false;
        state.message = action.payload || 'Failed to fetch residents';
      });
  },
});

export const {
  resetResident,
  clearSelectedResidents,
  clearError,
} = residentSlice.actions;

export default residentSlice.reducer;
