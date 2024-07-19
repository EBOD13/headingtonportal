import axios from "axios";

const API_URL = "/api/guests/"



const registerGuest = async(guestData, token) =>{
    const config = {
        headers: {
            Authorization: `Bearer ${token}`,
        }
    }
    const response = await axios.post(API_URL + 'register', guestData, config)
    return response.data
}

const getCheckedInGuests = async token =>{
    const config = {
        headers: {
            Authorization: `Bearer ${token}`,
        }
    }
    const response = await axios.get(API_URL + 'allguests', config)
    return response.data
}

const checkInGuest = async (guestId, token) => {
    const config = {
        headers: {
            Authorization: `Bearer ${token}`,
        }
    };
    try {
        const response = await axios.put(API_URL + 'checkin/' + guestId, null, config); // Pass null as request body
        return response.data;
    } catch (error) {
        console.error('Error checking in guest:', error);
        throw error; // Rethrow the error to handle it in the component
    }
};

const checkOutGuest = async (guestId, token) => {
    const config = {
        headers: {
            Authorization: `Bearer ${token}`,
        }
    };
    try {
        const response = await axios.put(API_URL + 'checkout/' + guestId, null, config); // Pass null as request body
        return response.data;
    } catch (error) {
        console.error('Error checking out guest:', error);
        throw error; // Rethrow the error to handle it in the component
    }
};

const getAllGuests = async(token) =>{
    const config = {
        headers: {
            Authorization: `Bearer ${token}`,
        }
    }
    const response = await axios.get(API_URL, config)
    return response.data
}

const guestService = { registerGuest, getCheckedInGuests, checkInGuest, checkOutGuest, getAllGuests}

export default guestService