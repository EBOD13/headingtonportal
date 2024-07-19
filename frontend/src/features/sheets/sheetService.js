import axios from "axios";

const API_URL = '/api/sheets/'

// Retrieve the google sheet data 

const readSheet = async token =>{
    const config = {
        headers: {
            Authorization: `Bearer ${token}`,
        }
    }
    try{
        const response = await axios.get(API_URL + 'read', config);
        return response.data
    }catch(error){
        console.error('Error reading from Google Sheets:', error);
        throw error;
    }
}

const appendToSheet = async (values, token) =>{
    const config = {
        headers: {
            Authorization: `Bearer ${token}`,
        }
    }
    try{
        const response = await axios.post(API_URL + 'append', values, config);
        return response.data
    }catch(error){
        console.error('Error reading from Google Sheets:', error);
        throw error;
    }
}

const updateRow = async ({ guestName, checkoutTime }, token) =>{
    const config = {
        headers: {
            Authorization: `Bearer ${token}`,
        }
    }
    try{
        const response = await axios.put(API_URL + 'update', { guestName, checkoutTime }, config);
        return response.data
    }catch(error){
        console.error('Error reading from Google Sheets:', error);
        throw error;
    }
}

const sheetService = {readSheet, appendToSheet, updateRow}

export default sheetService
