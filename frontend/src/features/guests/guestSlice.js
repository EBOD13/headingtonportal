import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import guestService from './guestService'

const initialState = {
    guests: [],
    isError: false,
    isLoading: false,
    isSuccess: false,
    message: ''
}



export const registerGuest = createAsyncThunk(
    'guests/register',
    async(guestData, thunkAPI)=>{
        try{
            const token = thunkAPI.getState().auth.clerk.token
            return await guestService.registerGuest(guestData, token)
        }
        catch (error){
            const message = (error.response && error.response.data && error.response.data.message) 
            || error.message 
            || error.toString()
            return thunkAPI.rejectWithValue(message)
        }
    }
)

export const getCheckedInGuests = createAsyncThunk(
    'guests/getCheckedInGuests',
    async(_, thunkAPI) =>{
        try{
            const token = thunkAPI.getState().auth.clerk.token
            return await guestService.getCheckedInGuests(token)
        }
        catch (error){
            const message = (error.response && error.response.data && error.response.data.message) 
            || error.message 
            || error.toString()
            return thunkAPI.rejectWithValue(message)
        }
    }
)

export const checkInGuest = createAsyncThunk(
    'guests/checkInGuests',
    async(guestId, thunkAPI) =>{
        try{
            const token = thunkAPI.getState().auth.clerk.token
            return await guestService.checkInGuest(guestId, token)
        }
        catch (error){
            const message = (error.response && error.response.data && error.response.data.message) 
            || error.message 
            || error.toString()
            return thunkAPI.rejectWithValue(message)
        }
    }
)



export const checkOutGuest = createAsyncThunk(
    'guests/checkoutguests',
    async(guestId, thunkAPI) =>{
        try{
            const token = thunkAPI.getState().auth.clerk.token
            return await guestService.checkOutGuest(guestId, token)
        }
        catch (error){
            const message = (error.response && error.response.data && error.response.data.message) 
            || error.message 
            || error.toString()
            return thunkAPI.rejectWithValue(message)
        }
    }
)

export const guestSlice = createSlice({
    name: 'guest',
    initialState,
    reducers:{
        resetGuest: state => initialState
    },
    extraReducers: (builder) =>{
        builder
        .addCase(registerGuest.pending, (state) =>{
            state.isLoading = true
        })
        .addCase(registerGuest.fulfilled, (state, action) =>{
            state.isLoading = false;
            state.isSuccess = true;
            state.guests = action.payload; // Update guests array directly
        })        
        .addCase(registerGuest.rejected, (state, action)=>{
            state.isError = true
            state.isLoading = false
            state.message = action.payload
        })
        .addCase(getCheckedInGuests.pending, (state)=>{
            state.isLoading = true
        })
        .addCase(getCheckedInGuests.fulfilled, (state, action) =>{
            state.isLoading = false
            state.isSuccess = true
            state.guests = action.payload
        })
        .addCase(getCheckedInGuests.rejected, (state, action)=>{
            state.isError = true
            state.isLoading = false
            state.message = action.payload
        })
        .addCase(checkInGuest.pending, (state)=>{
            state.isLoading = true
        })
        .addCase(checkInGuest.fulfilled, (state, action) =>{
            state.isLoading = false
            state.isSuccess = true
            state.guests = action.payload
        })
        .addCase(checkInGuest.rejected, (state, action)=>{
            state.isLoading = false
            state.isError = true
            state.message = action.payload
        })
        .addCase(checkOutGuest.pending, (state)=>{
            state.isLoading = true
        })
        .addCase(checkOutGuest.fulfilled, (state, action) =>{
            state.isLoading = false
            state.isSuccess = true
            state.guests = action.payload
        })
        .addCase(checkOutGuest.rejected, (state, action)=>{
            state.isLoading = false
            state.isError = true
            state.message = action.payload
        })
    }

})
export const getAllGuests = createAsyncThunk(
    'guests/getallguests',
    async(_, thunkAPI) => {
        try{
            const token = thunkAPI.getState().auth.clerk.token;
            return await guestService.getAllGuests(token)
        }catch (error){
            return thunkAPI.rejectWithValue(error.message || "Error fetching residents by room");
        }
    }
)

export const {resetGuest} = guestSlice.actions
export default guestSlice.reducer