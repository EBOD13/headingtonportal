// frontend/src/features/guests/guestService.js
import { api } from "../../api/client";

const API_URL = '/api/guests/';

const buildConfig = (token) => ({
  headers: { Authorization: `Bearer ${token}` }
});

// Get all guests
const getAllGuests = async (token) => {
  const response = await api.get(API_URL, buildConfig(token));
  return response.data;
};

// Get checked-in guests
const getCheckedInGuests = async (token) => {
  const response = await api.get(`${API_URL}allguests`, buildConfig(token));
  return response.data;
};

// Register guest
const registerGuest = async (guestData, token) => {
  const response = await api.post(`${API_URL}register`, guestData, buildConfig(token));
  return response.data;
};

// Check-in guest
const checkInGuest = async (guestId, token) => {
  const response = await api.put(`${API_URL}checkin/${guestId}`, {}, buildConfig(token));
  return response.data;
};

// Check-out guest
const checkOutGuest = async (guestId, token) => {
  const response = await api.put(`${API_URL}checkout/${guestId}`, {}, buildConfig(token));
  return response.data;
};

const guestService = {
  getAllGuests,
  getCheckedInGuests,
  registerGuest,
  checkInGuest,
  checkOutGuest,
};

export default guestService;