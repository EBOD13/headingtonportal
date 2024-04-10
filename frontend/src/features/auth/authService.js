import axios from "axios";

const API_URL = '/api/clerks/'

const register = async(clerkData) =>{
    const response = await axios.post(API_URL, clerkData)
    if(response.data){
        localStorage.setItem("clerk", JSON.stringify(response.data))
    }
    return response.data
}

const login = async(clerkData) =>{
    const response = await axios.post(API_URL + 'login', clerkData)

    if(response.data){
        localStorage.setItem('clerk', JSON.stringify(response.data))
    }
    return response.data
}

const logout = () => localStorage.removeItem('clerk')
const authService = {register, login, logout}

export default authService