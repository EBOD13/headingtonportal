// // frontend/src/features/guests/guestSlice.js
// import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
// import guestService from './guestService';

// // ======================
// // Initial State
// // ======================
// const initialState = {
//   guests: [],            // all guests
//   checkedInGuests: [],   // guests currently checked in
//   checkedInRooms: [],    // just the room list from /allguests
//   checkedInCount: 0,     // how many are checked in
//   lastUpdatedGuest: null, // guest updated by last checkin/checkout

//   isError: false,
//   isLoading: false,
//   isSuccess: false,
//   message: '',
// };

// // Export so hooks can safely fallback
// export const initialGuestState = initialState;

// // Helper: safely read the auth token from Redux
// const getAuthToken = (thunkAPI) => {
//   const state = thunkAPI.getState?.() || {};
//   const token = state.auth?.clerk?.token;

//   if (!token) {
//     // This will end up in the catch block and be returned as rejectWithValue
//     throw new Error('Not authenticated: missing Clerk token');
//   }
//   return token;
// };

// // Centralized error message builder
// const buildErrorMessage = (error, fallback) => {
//   return (
//     error?.response?.data?.message ||
//     error?.message ||
//     fallback
//   );
// };

// // ======================
// // Thunks
// // ======================

// // Register guest
// export const registerGuest = createAsyncThunk(
//   'guests/register',
//   async (guestData, thunkAPI) => {
//     console.log('[registerGuest] called with guestData:', guestData);
//     try {
//       const token = getAuthToken(thunkAPI);
//       const result = await guestService.registerGuest(guestData, token);
//       console.log('[registerGuest] service result:', result);
//       return result;
//     } catch (error) {
//       console.error('[registerGuest] error:', error);
//       const message = buildErrorMessage(error, 'Failed to register guest');
//       return thunkAPI.rejectWithValue(message);
//     }
//   }
// );

// // Get checked-in guests
// export const getCheckedInGuests = createAsyncThunk(
//   'guests/getCheckedInGuests',
//   async (_, thunkAPI) => {
//     console.log('[getCheckedInGuests] called');
//     try {
//       const token = getAuthToken(thunkAPI);
//       const result = await guestService.getCheckedInGuests(token);
//       console.log('[getCheckedInGuests] service result:', result);
//       return result; // { rooms, guests, count }
//     } catch (error) {
//       console.error('[getCheckedInGuests] error:', error);
//       const message = buildErrorMessage(error, 'Failed to fetch checked-in guests');
//       return thunkAPI.rejectWithValue(message);
//     }
//   }
// );

// // Check-in guest
// export const checkInGuest = createAsyncThunk(
//   'guests/checkInGuest',
//   async (guestId, thunkAPI) => {
//     console.log('[checkInGuest] called with guestId:', guestId);
//     try {
//       const token = getAuthToken(thunkAPI);
//       const result = await guestService.checkInGuest(guestId, token);
//       console.log('[checkInGuest] service result:', result);
//       return result; // usually updated guest or payload with message
//     } catch (error) {
//       console.error('[checkInGuest] error:', error);
//       const message = buildErrorMessage(error, 'Failed to check in guest');
//       return thunkAPI.rejectWithValue(message);
//     }
//   }
// );

// // Check-out guest
// export const checkOutGuest = createAsyncThunk(
//   'guests/checkOutGuest',
//   async (guestId, thunkAPI) => {

//     try {
//       const token = getAuthToken(thunkAPI);
//       const result = await guestService.checkOutGuest(guestId, token);
//       console.log('[checkOutGuest] service result:', result);
//       return result; // message or updated guest
//     } catch (error) {
//       console.error('[checkOutGuest] error:', error);
//       const message = buildErrorMessage(error, 'Failed to check out guest');
//       return thunkAPI.rejectWithValue(message);
//     }
//   }
// );

// // Get all guests
// export const getAllGuests = createAsyncThunk(
//   'guests/getAllGuests',
//   async (_, thunkAPI) => {
//     console.log('[getAllGuests] called');
//     try {
//       const token = getAuthToken(thunkAPI);
//       const result = await guestService.getAllGuests(token);
//       console.log('[getAllGuests] service result:', result);
//       return result; // array of guests (or wrapped in { guests } depending on backend)
//     } catch (error) {
//       console.error('[getAllGuests] error:', error);
//       const message = buildErrorMessage(error, 'Failed to fetch guests');
//       return thunkAPI.rejectWithValue(message);
//     }
//   }
// );

// // ======================
// // Slice
// // ======================

// export const guestSlice = createSlice({
//   name: 'guest',
//   initialState,
//   reducers: {
//     resetGuest: () => {
//       console.log('[guestSlice] resetGuest to initial state');
//       return initialState;
//     },
//     clearGuestError: (state) => {
//       console.log('[guestSlice] clearGuestError');
//       state.isError = false;
//       state.message = '';
//     },
//   },
//   extraReducers: (builder) => {
//     builder
//       // ========== registerGuest ==========
//       .addCase(registerGuest.pending, (state) => {
//         console.log('[guestSlice] registerGuest.pending');
//         state.isLoading = true;
//         state.isError = false;
//         state.isSuccess = false;
//         state.message = '';
//       })
//       .addCase(registerGuest.fulfilled, (state, action) => {
//         console.log('[guestSlice] registerGuest.fulfilled payload:', action.payload);
//         state.isLoading = false;
//         state.isSuccess = true;
//         state.message =
//           action.payload?.message || 'Guest registered successfully';
//         // You can optionally push to `guests` if backend returns the guest object:
//         // if (action.payload?.guest) {
//         //   state.guests.push(action.payload.guest);
//         // }
//       })
//       .addCase(registerGuest.rejected, (state, action) => {
//         console.error('[guestSlice] registerGuest.rejected payload:', action.payload);
//         console.error('[guestSlice] registerGuest.rejected error:', action.error);
//         state.isLoading = false;
//         state.isError = true;
//         state.message = action.payload || 'Failed to register guest';
//       })

//       // ========== getCheckedInGuests ==========
//       .addCase(getCheckedInGuests.pending, (state) => {
//         console.log('[guestSlice] getCheckedInGuests.pending');
//         state.isLoading = true;
//         state.isError = false;
//         state.isSuccess = false;
//         state.message = '';
//       })
//       .addCase(getCheckedInGuests.fulfilled, (state, action) => {
//         console.log('[guestSlice] getCheckedInGuests.fulfilled payload:', action.payload);
//         state.isLoading = false;
//         state.isSuccess = true;

//         const payload = action.payload || {};
//         const rooms = payload.rooms || [];
//         const guests = payload.guests || [];
//         const count =
//           typeof payload.count === 'number' ? payload.count : guests.length;

//         state.checkedInGuests = guests;
//         state.checkedInRooms = rooms;
//         state.checkedInCount = count;
//         state.message = `Loaded ${count} checked-in guest(s)`;
//       })
//       .addCase(getCheckedInGuests.rejected, (state, action) => {
//         console.error('[guestSlice] getCheckedInGuests.rejected payload:', action.payload);
//         console.error('[guestSlice] getCheckedInGuests.rejected error:', action.error);
//         state.isLoading = false;
//         state.isError = true;
//         state.message =
//           action.payload || 'Failed to fetch checked-in guests';
//       })

//       // ========== checkInGuest ==========
//       .addCase(checkInGuest.pending, (state) => {
//         console.log('[guestSlice] checkInGuest.pending');
//         state.isLoading = true;
//         state.isError = false;
//         state.isSuccess = false;
//         state.message = '';
//       })
//       .addCase(checkInGuest.fulfilled, (state, action) => {
//         console.log('[guestSlice] checkInGuest.fulfilled payload:', action.payload);
//         state.isLoading = false;
//         state.isSuccess = true;
//         state.lastUpdatedGuest = action.payload || null;
//         state.message =
//           action.payload?.message ||
//           'Guest checked in successfully (refresh list to see changes)';

//         // Optional: if backend returns updated guest object, you could sync
//         // checkedInGuests here or mark a specific guest as checked in.
//       })
//       .addCase(checkInGuest.rejected, (state, action) => {
//         console.error('[guestSlice] checkInGuest.rejected payload:', action.payload);
//         console.error('[guestSlice] checkInGuest.rejected error:', action.error);
//         state.isLoading = false;
//         state.isError = true;
//         state.message =
//           action.payload || 'Failed to check in guest';
//       })

//       // ========== checkOutGuest ==========
//       .addCase(checkOutGuest.pending, (state) => {
//         console.log('[guestSlice] checkOutGuest.pending');
//         state.isLoading = true;
//         state.isError = false;
//         state.isSuccess = false;
//         state.message = '';
//       })
//       .addCase(checkOutGuest.fulfilled, (state, action) => {
//         console.log('[guestSlice] checkOutGuest.fulfilled payload:', action.payload);
//         state.isLoading = false;
//         state.isSuccess = true;
//         state.lastUpdatedGuest =
//           typeof action.payload === 'object' ? action.payload : null;
//         state.message =
//           action.payload?.message || 'Guest checked out successfully';

//         // Optional: you can also update checkedInGuests here if payload includes guest details
//       })
//       .addCase(checkOutGuest.rejected, (state, action) => {
//         console.error('[guestSlice] checkOutGuest.rejected payload:', action.payload);
//         console.error('[guestSlice] checkOutGuest.rejected error:', action.error);
//         state.isLoading = false;
//         state.isError = true;
//         state.message =
//           action.payload || 'Failed to check out guest';
//       })

//       // ========== getAllGuests ==========
//       .addCase(getAllGuests.pending, (state) => {
//         console.log('[guestSlice] getAllGuests.pending');
//         state.isLoading = true;
//         state.isError = false;
//         state.isSuccess = false;
//         state.message = '';
//       })
//       .addCase(getAllGuests.fulfilled, (state, action) => {
//   console.log('[guestSlice] getAllGuests.fulfilled payload:', action.payload);
//   state.isLoading = false;
//   state.isSuccess = true;

//   const payload = action.payload || {};
  
//   // The backend returns { success: true, count: X, guests: [...] }
//   if (payload.guests && Array.isArray(payload.guests)) {
//     state.guests = payload.guests;
//     state.totalGuestsCount = payload.count || payload.guests.length;
//   } else if (Array.isArray(payload)) {
//     // Fallback: if payload is directly an array
//     state.guests = payload;
//     state.totalGuestsCount = payload.length;
//   } else {
//     state.guests = [];
//     state.totalGuestsCount = 0;
//   }

//   state.message = `Loaded ${state.guests.length} guest(s)`;
// })

//       .addCase(getAllGuests.rejected, (state, action) => {
//         console.error('[guestSlice] getAllGuests.rejected payload:', action.payload);
//         console.error('[guestSlice] getAllGuests.rejected error:', action.error);
//         state.isLoading = false;
//         state.isError = true;
//         state.message =
//           action.payload || 'Failed to fetch guests';
//       });
//   },
// });

// export const { resetGuest, clearGuestError } = guestSlice.actions;
// export default guestSlice.reducer;


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