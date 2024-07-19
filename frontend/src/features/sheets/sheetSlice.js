import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import sheetService from './sheetService'

const initialState = {
    sheets: [],
    isError: false,
    isLoading: false,
    isSuccess: false,
    message: ''
}



export const readSheet = createAsyncThunk(
    'sheets/read',
    async(_, thunkAPI)=>{
        try{
            const token = thunkAPI.getState().auth.clerk.token
            return await sheetService.readSheet(token)
        }
        catch (error){
            const message = (error.response && error.response.data && error.response.data.message) 
            || error.message 
            || error.toString()
            return thunkAPI.rejectWithValue(message)
        }
    }
)

export const appendToSheet = createAsyncThunk(
    'sheets/append',
    async(values, thunkAPI)=>{
        try{
            const token = thunkAPI.getState().auth.clerk.token
            return await sheetService.appendToSheet(values, token)
        }
        catch (error){
            const message = (error.response && error.response.data && error.response.data.message) 
            || error.message 
            || error.toString()
            return thunkAPI.rejectWithValue(message)
        }
    }
)

export const updateRow = createAsyncThunk(
    'sheets/update',
    async({ guestName, checkoutTime }, thunkAPI)=>{
        try{
            const token = thunkAPI.getState().auth.clerk.token
            return await sheetService.updateRow({ guestName, checkoutTime }, token)
        }
        catch (error){
            const message = (error.response && error.response.data && error.response.data.message) 
            || error.message 
            || error.toString()
            return thunkAPI.rejectWithValue(message)
        }
    }
)

export const sheetSlice = createSlice({
    name: 'sheet',
    initialState, 
    reducers:{
        reset: state => {
            state.isLoading = false
            state.isSuccess = false
            state.isError = false
            state.message = ''
        },
    },
    extraReducers: builder =>{
        builder
        .addCase(readSheet.pending, (state)=>{
            state.isLoading = true
        })
        .addCase(readSheet.fulfilled, (state, action) =>{
            state.isLoading = false
            state.isSuccess = true
            state.clerk = action.payload
        })
        .addCase(readSheet.rejected, (state, action)=>{
            state.isLoading = false
            state.isError = true
            state.clerk = null
            state.message = action.payload
        })
        .addCase(appendToSheet.pending, (state)=>{
            state.isLoading = true
        })
        .addCase(appendToSheet.fulfilled, (state, action) =>{
            state.isLoading = false
            state.isSuccess = true
            state.clerk = action.payload
        })
        .addCase(appendToSheet.rejected, (state, action)=>{
            state.isLoading = false
            state.isError = true
            state.clerk = null
            state.message = action.payload
        })
        .addCase(updateRow.pending, (state)=>{
            state.isLoading = true
        })
        .addCase(updateRow.fulfilled, (state, action) =>{
            state.isLoading = false
            state.isSuccess = true
            state.clerk = action.payload
        })
        .addCase(updateRow.rejected, (state, action)=>{
            state.isLoading = false
            state.isError = true
            state.clerk = null
            state.message = action.payload
        })

    }
})

export default sheetSlice.reducer