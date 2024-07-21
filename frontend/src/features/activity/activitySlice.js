import { createSlice } from '@reduxjs/toolkit';

// Define the initial state of the activities
const initialState = [];

// Create a slice for activity management
const activitySlice = createSlice({
  name: 'activity',
  initialState,
  reducers: {
    // Reducer to add a new activity to the state
    addActivity: (state, action) => {
      state.push(action.payload);
    }
  }
});

// Export the action to add an activity
export const { addActivity } = activitySlice.actions;

// Export the reducer to be used in the store
export default activitySlice.reducer;

// Selector to access activities from the state
export const selectActivities = (state) => state.activity;
