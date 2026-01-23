import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import guestReducer from '../features/guests/guestSlice';
import residentReducer from '../features/residents/residentSlice';
import sheetReducer from '../features/sheets/sheetSlice';
import activityReducer from '../features/activity/activitySlice';
import adminReducer from '../features/admin/adminSlice'; 

export const store = configureStore({
  reducer: {
    auth: authReducer,
    guests: guestReducer,
    resident: residentReducer,
    sheets: sheetReducer,
    activity: activityReducer,
    admin: adminReducer,           
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['resident/getResidentByRoom/pending'],
        ignoredActionPaths: ['meta.arg', 'payload.timestamp'],
        ignoredPaths: ['resident.selectedResidents'],
      },
    }),
});
