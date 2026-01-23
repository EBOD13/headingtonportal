// frontend/src/app/store.js - FIXED
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import guestReducer from '../features/guests/guestSlice';
import residentReducer from '../features/residents/residentSlice'; // Make sure this matches
import sheetReducer from '../features/sheets/sheetSlice';
import activityReducer from '../features/activity/activitySlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    guests: guestReducer,
    resident: residentReducer, // Changed from 'residents' to 'resident'
    sheets: sheetReducer,
    activity: activityReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['resident/getResidentByRoom/pending'],
        // Ignore these field paths in all actions
        ignoredActionPaths: ['meta.arg', 'payload.timestamp'],
        // Ignore these paths in the state
        ignoredPaths: ['resident.selectedResidents'],
      },
    }),
});