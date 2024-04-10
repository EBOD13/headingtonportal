import axios from "axios";

const API_URL = '/api/residents/'

const getResidentByRoom = async(roomNumber, token)=>{
    const config = {
        headers: {
            Authorization: `Bearer ${token}`,
        }
    }
    const response = await axios.get(API_URL + roomNumber, config)
    return response.data
}
const getGuestsByHost = async(hostId, token) =>{
    const config = {
        headers: {
            Authorization: `Bearer ${token}`,
        }
    }
    const response = await axios.get(API_URL + 'guests/' + hostId, config)
    return response.data
}
const residentService = {getResidentByRoom, getGuestsByHost}

export default residentService