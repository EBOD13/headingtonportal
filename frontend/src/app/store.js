import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice'
import guestReducer from '../features/guests/guestSlice'
import residentReducer from '../features/residents/residentSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    guests: guestReducer,
    residents: residentReducer
  }
});
