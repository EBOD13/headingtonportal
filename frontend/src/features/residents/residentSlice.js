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

      const res = await residentService.getResidentByRoom(formattedRoom, token);

      return res;
    } catch (error) {
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
      const res = await residentService.getGuestsByHost(hostId, token);
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


      const res = await residentService.getAllResidents(token);


      return res;
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to fetch all residents';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Update Resident Status
export const updateResidentStatus = createAsyncThunk(
  'residents/updateStatus',
  async ({ id, updates }, thunkAPI) => {
    try {
      const token = getAuthToken(thunkAPI);
      const updated = await residentService.updateResident(id, updates, token);
      return updated;
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to update resident';
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
        state.isLoading = true;
        state.isError = false;
        state.isSuccess = false;
        state.message = '';
        state.selectedResidents = [];
      })
      .addCase(getResidentByRoom.fulfilled, (state, action) => {
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

        state.isLoading = true;
        state.isError = false;
        state.isSuccess = false;
        state.message = '';
        state.guestsByHost = [];
        state.guestsStatsByHost = null;
      })
      .addCase(getGuestsByHost.fulfilled, (state, action) => {
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
        state.isLoading = false;
        state.isError = true;
        state.isSuccess = false;
        state.guestsByHost = [];
        state.guestsStatsByHost = null;
        state.message = action.payload || 'Failed to fetch guests';
      })

      // =========================
      // Update Resident Status
      // =========================
      .addCase(updateResidentStatus.pending, (state) =>{
        state.isLoading = true;
        state.isError = false;
        state.isSuccess = false;
        state.message = '';
      })

      .addCase(updateResidentStatus.fulfilled, (state, action) => {
  state.isLoading = false;
  state.isSuccess = true;
  state.isError = false;

  const updated = action.payload;
  const id = updated._id || updated.id;

  // Update in residents list 
  if (Array.isArray(state.residents) && id) {
    const idx = state.residents.findIndex(
      (res) => (res._id || res.id) === id
    );
    if (idx !== -1) {
      state.residents[idx] = updated;
    }
  }

  // Update in selectedResidents (modal source)
  if (Array.isArray(state.selectedResidents) && id) {
    const idx = state.selectedResidents.findIndex(
      (r) => (r._id || r.id) === id
    );
    if (idx !== -1) {
      state.selectedResidents[idx] = updated;
    }
  }

  state.message = 'Resident updated successfully';
      })
      .addCase(updateResidentStatus.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.isSuccess = false;
        state.message = action.payload || 'Failed to update resident';
      })


      // =========================
      // Get All Residents
      // =========================
      .addCase(getAllResidents.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.isSuccess = false;
        state.message = '';
      })
      .addCase(getAllResidents.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;

        state.residents = Array.isArray(action.payload)
          ? action.payload
          : [];

        state.message = `Loaded ${state.residents.length} resident(s)`;
      })
      .addCase(getAllResidents.rejected, (state, action) => {
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
