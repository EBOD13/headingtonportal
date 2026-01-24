// frontend/src/features/auth/authSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import authService from "./authService";

const localclerk = JSON.parse(localStorage.getItem('clerk'));

const initialState = {
  clerk: localclerk ? localclerk : null,
  isError: false,
  isSuccess: false,
  isLoading: false,
  message: "",
};

// ==============================
// Self-registration
// ==============================
export const register = createAsyncThunk(
  'auth/register',
  async (clerk, thunkAPI) => {
    try {
      return await authService.register(clerk);
    } catch (error) {
      const message =
        (error.response &&
          error.response.data &&
          error.response.data.message) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// ==============================
// Login
// ==============================
export const login = createAsyncThunk(
  'auth/login',
  async (clerk, thunkAPI) => {
    try {
      return await authService.login(clerk);
    } catch (error) {
      const message =
        (error.response &&
          error.response.data &&
          error.response.data.message) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// ==============================
// Logout
// ==============================
export const logout = createAsyncThunk(
  'auth/logout',
  async () => authService.logout()
);

// ==============================
// Admin: create clerk
// ==============================
export const adminCreateClerk = createAsyncThunk(
  'auth/adminCreateClerk',
  async (clerkData, thunkAPI) => {
    try {
      const state = thunkAPI.getState();
      console.log('=== DEBUG adminCreateClerk ===');
      console.log('clerkData received:', clerkData);
      console.log('Full auth state:', state.auth);
      console.log('clerk object:', state.auth.clerk);
      console.log('token:', state.auth.clerk?.token);
      
      const token = state.auth.clerk?.token;

      if (!token) {
        console.log('NO TOKEN FOUND - rejecting');
        return thunkAPI.rejectWithValue('Not authenticated as admin.');
      }
      
      console.log('Making API call with token:', token.substring(0, 20) + '...');
      const result = await authService.adminCreateClerk(clerkData, token);
      console.log('API result:', result);
      return result;
    } catch (error) {
      console.error('adminCreateClerk error:', error);
      const message =
        (error.response?.data?.message) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// ==============================
// Password set via token
// ==============================
export const setPasswordWithToken = createAsyncThunk(
  'auth/setPasswordWithToken',
  async ({ token, password, password2 }, thunkAPI) => {
    try {
      const data = await authService.setPasswordWithToken(token, {
        password,
        password2,
      });
      return data;
    } catch (error) {
      const message =
        (error.response &&
          error.response.data &&
          error.response.data.message) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// ==============================
// Slice
// ==============================
export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    reset: (state) => {
      state.isLoading = false;
      state.isSuccess = false;
      state.isError = false;
      state.message = '';
    },
  },
  extraReducers: (builder) => {
    builder
      // --- register ---
      .addCase(register.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.clerk = action.payload;
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
        state.clerk = null;
      })

      // --- login ---
      .addCase(login.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.clerk = action.payload;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.clerk = null;
        state.message = action.payload;
      })

      // --- logout ---
      .addCase(logout.fulfilled, (state) => {
        state.clerk = null;
      })

      // --- adminCreateClerk ---
      .addCase(adminCreateClerk.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.message = '';
      })
      .addCase(adminCreateClerk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        // DO NOT overwrite state.clerk here.
        // Admin remains logged in as themselves.
      })
      .addCase(adminCreateClerk.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

      // --- setPasswordWithToken ---
      .addCase(setPasswordWithToken.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.message = '';
      })
      .addCase(setPasswordWithToken.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.clerk = action.payload; 
        })
      .addCase(setPasswordWithToken.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      });
  },
});

export const { reset } = authSlice.actions;
export default authSlice.reducer;
