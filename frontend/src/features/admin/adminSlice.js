// frontend/src/features/admin/adminSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import adminService from "./adminService";

// ======================
// Helpers
// ======================

const getAuthToken = (thunkAPI) => {
  const state = thunkAPI.getState?.() || {};
  const token = state.auth?.clerk?.token;

  if (!token) {
    throw new Error("Not authenticated: missing Clerk token");
  }
  return token;
};

const initialState = {
  // Clerks
  clerks: [],
  selectedClerk: null,

  // Residents
  residents: [],
  selectedResident: null,

  // Shared status
  isLoading: false,
  isError: false,
  isSuccess: false,
  message: "",
};

// ======================
// Thunks: CLERKS
// ======================

// GET /api/admin/clerks
export const fetchClerkRoster = createAsyncThunk(
  "admin/fetchClerkRoster",
  async (_, thunkAPI) => {
    try {
      const token = getAuthToken(thunkAPI);
      return await adminService.getClerkRoster(token);
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Failed to fetch clerks";
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// GET /api/admin/clerks/:id
export const fetchClerkDetail = createAsyncThunk(
  "admin/fetchClerkDetail",
  async (id, thunkAPI) => {
    try {
      const token = getAuthToken(thunkAPI);
      return await adminService.getClerkDetail(id, token);
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Failed to fetch clerk detail";
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// PUT /api/admin/clerks/:id/status
export const setClerkStatus = createAsyncThunk(
  "admin/setClerkStatus",
  async ({ id, updates }, thunkAPI) => {
    try {
      const token = getAuthToken(thunkAPI);
      const result = await adminService.updateClerkStatus({ id, updates }, token);
      return { id, result };
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Failed to update clerk status";
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// DELETE /api/admin/clerks/:id
export const removeClerk = createAsyncThunk(
  "admin/removeClerk",
  async (id, thunkAPI) => {
    try {
      const token = getAuthToken(thunkAPI);
      await adminService.deleteClerk(id, token);
      return id;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Failed to delete clerk";
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// POST /api/admin/clerks/import
export const importClerks = createAsyncThunk(
  "admin/importClerks",
  async (file, thunkAPI) => {
    try {
      const token = getAuthToken(thunkAPI);
      const result = await adminService.importClerksFromFile(file, token);
      return result; // { message, totalRows, successCount, errorCount, results: [...] }
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Failed to import clerks";
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// ======================
// Thunks: RESIDENTS
// ======================

// GET /api/admin/residents
export const fetchResidentRoster = createAsyncThunk(
  "admin/fetchResidentRoster",
  async (filters = {}, thunkAPI) => {
    try {
      const token = getAuthToken(thunkAPI);
      return await adminService.getResidentRoster(filters, token); // 👈 now valid
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Failed to fetch residents";
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// POST /api/admin/residents
export const createResidentAdmin = createAsyncThunk(
  "admin/createResidentAdmin",
  async (data, thunkAPI) => {
    try {
      const token = getAuthToken(thunkAPI);
      return await adminService.createResidentAdmin(data, token);
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Failed to create resident";
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// PUT /api/admin/residents/:id/status
export const setResidentStatusAdmin = createAsyncThunk(
  "admin/setResidentStatusAdmin",
  async ({ id, updates }, thunkAPI) => {
    try {
      const token = getAuthToken(thunkAPI);
      const result = await adminService.updateResidentStatus({ id, updates }, token);
      return { id, result };
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Failed to update resident status";
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// DELETE /api/admin/residents/:id
export const removeResidentAdmin = createAsyncThunk(
  "admin/removeResidentAdmin",
  async (id, thunkAPI) => {
    try {
      const token = getAuthToken(thunkAPI);
      await adminService.deleteResidentAdmin(id, token);
      return id;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Failed to delete resident";
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// POST /api/admin/residents/import
export const importResidents = createAsyncThunk(
  "admin/importResidents",
  async (file, thunkAPI) => {
    try {
      const token = getAuthToken(thunkAPI);
      const result = await adminService.importResidentsFromFile(file, token);
      return result;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Failed to import residents";
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// ======================
// Slice
// ======================

export const adminSlice = createSlice({
  name: "admin",
  initialState,
  reducers: {
    resetAdmin: () => initialState,
    clearAdminError: (state) => {
      state.isError = false;
      state.message = "";
    },
    setSelectedClerkLocal: (state, action) => {
      state.selectedClerk = action.payload;
    },
    setSelectedResidentLocal: (state, action) => {
      state.selectedResident = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // ========= Clerks: roster =========
      .addCase(fetchClerkRoster.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.isSuccess = false;
        state.message = "";
      })
      .addCase(fetchClerkRoster.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;

        const payload = action.payload || {};
        // Allow either { clerks: [...] } or straight array
        if (Array.isArray(payload)) {
          state.clerks = payload;
        } else if (Array.isArray(payload.clerks)) {
          state.clerks = payload.clerks;
        } else {
          state.clerks = [];
        }

        state.message = `Loaded ${state.clerks.length} clerk(s)`;
      })
      .addCase(fetchClerkRoster.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload || "Failed to fetch clerks";
      })

      // ========= Clerks: detail =========
      .addCase(fetchClerkDetail.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.isSuccess = false;
        state.message = "";
      })
      .addCase(fetchClerkDetail.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;

        state.selectedClerk = action.payload?.clerk || action.payload || null;
        state.message = "Clerk detail loaded";
      })
      .addCase(fetchClerkDetail.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload || "Failed to fetch clerk detail";
      })

      
      // ========= Clerks: status =========
      .addCase(setClerkStatus.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.isSuccess = false;
      })
      .addCase(setClerkStatus.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;

        const { id, result } = action.payload || {};
        const updated = result?.clerk || result || null;

        if (updated) {
          // update in list
          state.clerks = state.clerks.map((c) =>
            String(c._id) === String(id) ? { ...c, ...updated } : c
          );

          // update selected if matching
          if (
            state.selectedClerk &&
            String(state.selectedClerk._id) === String(id)
          ) {
            state.selectedClerk = { ...state.selectedClerk, ...updated };
          }
        }

        state.message = "Clerk status updated";
      })
      .addCase(setClerkStatus.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload || "Failed to update clerk status";
      })

      // ========= Clerks: delete =========
      .addCase(removeClerk.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.isSuccess = false;
      })
      .addCase(removeClerk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;

        const id = action.payload;
        state.clerks = state.clerks.filter(
          (c) => String(c._id) !== String(id)
        );

        if (
          state.selectedClerk &&
          String(state.selectedClerk._id) === String(id)
        ) {
          state.selectedClerk = null;
        }

        state.message = "Clerk deleted";
      })
      .addCase(removeClerk.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload || "Failed to delete clerk";
      })

      // ========= Clerks: import =========
      .addCase(importClerks.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.isSuccess = false;
      })
      .addCase(importClerks.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;

        const payload = action.payload || {};
        state.message =
          payload.message ||
          `Imported ${payload.successCount || 0} clerk(s)`;

        // You *could* choose to refetch roster here instead of guessing:
        // We'll just leave clerks as-is and let the screen call fetchClerkRoster after.
      })
      .addCase(importClerks.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload || "Failed to import clerks";
      })

       // ========= Residents: create =========
      .addCase(createResidentAdmin.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.isSuccess = false;
      })
      .addCase(createResidentAdmin.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;

        const payload = action.payload || {};
        // Allow either { resident } or the resident object directly
        const newResident = payload.resident || payload;

        if (newResident && newResident._id) {
          // Prepend so newest appears at the top
          state.residents = [newResident, ...(state.residents || [])];
        }

        state.message = payload.message || "Resident created";
      })
      .addCase(createResidentAdmin.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload || "Failed to create resident";
      })
      // ========= Residents: roster =========
      .addCase(fetchResidentRoster.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.isSuccess = false;
      })
      .addCase(fetchResidentRoster.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;

        const payload = action.payload || {};
        state.residents = Array.isArray(payload)
          ? payload
          : Array.isArray(payload.residents)
          ? payload.residents
          : payload;

        state.message = `Loaded ${state.residents.length || 0} resident(s)`;
      })
      .addCase(fetchResidentRoster.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload || "Failed to fetch residents";
      })

      // ========= Residents: status =========
      .addCase(setResidentStatusAdmin.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.isSuccess = false;
      })
      .addCase(setResidentStatusAdmin.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;

        const { id, result } = action.payload || {};
        const updated = result?.resident || result || null;

        if (updated) {
          state.residents = (state.residents || []).map((r) =>
            String(r._id) === String(id) ? { ...r, ...updated } : r
          );

          if (
            state.selectedResident &&
            String(state.selectedResident._id) === String(id)
          ) {
            state.selectedResident = {
              ...state.selectedResident,
              ...updated,
            };
          }
        }

        state.message = "Resident status updated";
      })
      .addCase(setResidentStatusAdmin.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload || "Failed to update resident status";
      })

      // ========= Residents: delete =========
      .addCase(removeResidentAdmin.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.isSuccess = false;
      })
      .addCase(removeResidentAdmin.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;

        const id = action.payload;
        state.residents = (state.residents || []).filter(
          (r) => String(r._id) !== String(id)
        );

        if (
          state.selectedResident &&
          String(state.selectedResident._id) === String(id)
        ) {
          state.selectedResident = null;
        }

        state.message = "Resident deleted";
      })
      .addCase(removeResidentAdmin.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload || "Failed to delete resident";
      })

      // ========= Residents: import =========
      .addCase(importResidents.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.isSuccess = false;
      })
      .addCase(importResidents.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;

        const payload = action.payload || {};
        state.message =
          payload.message ||
          `Imported ${payload.successCount || 0} resident(s)`;
      })
      .addCase(importResidents.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload || "Failed to import residents";
      });
  },
});

export const {
  resetAdmin,
  clearAdminError,
  setSelectedClerkLocal,
  setSelectedResidentLocal,
} = adminSlice.actions;

export default adminSlice.reducer;
