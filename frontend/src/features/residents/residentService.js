// frontend/src/features/residents/residentService.js
import { api } from "../../api/client";

const API_URL = '/api/residents/';

// Small helper for auth header
const buildConfig = (token) => ({
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

// ==============================
// Get ALL residents
// ==============================
const getAllResidents = async (token) => {
  const config = buildConfig(token);
  const response = await api.get(API_URL, config);
  return response.data;
};

// ==============================
// Create resident (admin or clerk)
// ==============================
const createResident = async (data, token) => {
  const config = buildConfig(token);
  const res = await api.post(API_URL, data, config);
  return res.data;
};

// ==============================
// Update resident (status, details, etc.)
// ==============================
const updateResident = async (id, updates, token) => {
  const config = buildConfig(token);
  const res = await api.put(`${API_URL}${id}`, updates, config);
  return res.data;
};
// ==============================
// Get resident(s) by room
// ==============================
const getResidentByRoom = async (roomNumber, token) => {
  const config = buildConfig(token);
  const response = await api.get(`${API_URL}${roomNumber}`, config);
  return response.data;
};

// ==============================
// Delete resident
// ==============================
const deleteResident = async (id, token) => {
  const config = buildConfig(token);
  const res = await api.delete(`${API_URL}${id}`, config);
  return res.data;
};
// ==============================
// Get guests by host ID
// ==============================
const getGuestsByHost = async (hostId, token) => {
  const config = buildConfig(token);
  const response = await api.get(`${API_URL}guests/${hostId}`, config);
  return response.data;
};

const residentService = {
  getResidentByRoom,
  getGuestsByHost,
  getAllResidents,
  updateResident,
  deleteResident,
  createResident
};

export default residentService;
