import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import residentService from './residentService'

const initialState = {
    residents: [],
    isError: false,
    isLoading: false,
    isSuccess: false,
    message: ''
}

export const getResidentByRoom = createAsyncThunk(
    'residents/getresident',
    async (roomNumber, thunkAPI) => {
        try {
            const token = thunkAPI.getState().auth.clerk.token;
            return await residentService.getResidentByRoom(roomNumber, token);
        } catch (error) {
            return thunkAPI.rejectWithValue(error.message || "Error fetching residents by room");
        }
    }
);

export const getGuestsByHost = createAsyncThunk(
    'residents/getguestsname',
    async(hostId, thunkAPI) =>{
        try{
            const token = thunkAPI.getState().auth.clerk.token;
            return await residentService.getGuestsByHost(hostId, token)
        }catch (error) {
            return thunkAPI.rejectWithValue(error.message || "Error fetching residents by room");
        }
    }
)

/* This slice allows us to communicate with the server and get the list of all residents in the system
by using the thunkAPI and the clerk token */
export const getAllResidents = createAsyncThunk(
    'residents/getallresidents',
    async(_, thunkAPI) => {
        try{
            const token = thunkAPI.getState().auth.clerk.token;
            return await residentService.getAllResidents(token)
        }catch (error){
            return thunkAPI.rejectWithValue(error.message || "Error fetching residents by room");
        }
    }
)

export const residentSlice = createSlice({
name: 'resident',
initialState,
reducer:{
    resetResident: state => initialState
},
extraReducers: (builder) =>{
    builder
    .addCase(getResidentByRoom.pending, (state) =>{
        state.isLoading = true
    })
    .addCase(getResidentByRoom.fulfilled, (state, action) =>{
        state.isLoading = false
        state.isSuccess = true
        state.residents = action.payload
    })
    .addCase(getResidentByRoom.rejected, (state, action) =>{
        state.isLoading = false
        state.isError = true
        state.message = action.payload
    })
    .addCase(getGuestsByHost.pending, (state) =>{ // Change getGuestByHost to getGuestsByHost
        state.isLoading = false
    })
    .addCase(getAllResidents.rejected, (state, action) =>{
        state.isLoading = false
        state.isError = true
        state.message = action.payload
    })
    .addCase(getAllResidents.pending, (state) =>{ // Change getGuestByHost to getGuestsByHost
        state.isLoading = false
    })
}
}
)

export const {resetResident} = residentSlice.actions
export default residentSlice.reducer
