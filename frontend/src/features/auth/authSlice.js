import {createSlice, createAsyncThunk} from "@reduxjs/toolkit"
import authService from "./authService"

const localclerk = JSON.parse(localStorage.getItem('clerk'))

const initialState = {
    clerk: localclerk ? localclerk: null,
    isError: false, 
    isSuccess: false,
    isLoading: false,
    message: ""
}

export const register = createAsyncThunk(
    'auth/register',
    async(clerk, thunkAPI) =>{
        try{
            return await authService.register(clerk)
        }
        catch (error){
            const message = (error.response && error.response.data && error.response.data.message) ||
            error.message ||
            error.toString()
        return thunkAPI.rejectWithValue(message)
        }
    }
)

export const login = createAsyncThunk(
    'auth/login', async(clerk, thunkAPI) =>{
        try{
            return await authService.login(clerk)
        }
        catch (error){
            const message = (error.response && error.response.data && error.response.data.message) || error.message || error.toString()
            return thunkAPI.rejectWithValue(message)
        }
    }
)


export const logout = createAsyncThunk('auth/logout', async() => await authService.logout())

export const authSlice = createSlice({
    name: 'auth',
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
        .addCase(register.pending, (state) =>{
            state.isLoading= true
        })
        .addCase(register.fulfilled, (state, action)=>{
            state.isLoading = false
            state.isSuccess = true
            state.clerk = action.payload
        })
        .addCase(register.rejected, (state, action)=>{
            state.isLoading = false
            state.isError = true 
            state.message = action.payload
            state.clerk = null
        })
        .addCase(login.pending, (state)=>{
            state.isLoading = true
        })
        .addCase(login.fulfilled, (state, action) =>{
            state.isLoading = false
            state.isSuccess = true
            state.clerk = action.payload
        })
        .addCase(login.rejected, (state, action)=>{
            state.isLoading = false
            state.isError = true
            state.clerk = null
            state.message = action.payload
        })
        .addCase(logout.fulfilled, (state)=>{
            state.clerk = null
        })

    }
})

export const { reset } = authSlice.actions;
export default authSlice.reducer