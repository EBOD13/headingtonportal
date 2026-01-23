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
// GET /api/residents
// ==============================
const getAllResidents = async (token) => {
  const config = buildConfig(token);
  const response = await api.get(API_URL, config);
  // Expecting an array of residents
  return response.data;
};

// ==============================
// Get resident(s) by room
// GET /api/residents/:roomNumber
// (roomNumber like "N101", "S222")
// ==============================
const getResidentByRoom = async (roomNumber, token) => {
  const config = buildConfig(token);
  const response = await api.get(`${API_URL}${roomNumber}`, config);
  // Backend might return array or single object; slice will handle both
  return response.data;
};

// ==============================
// Get guests by host ID
// GET /api/residents/guests/:hostId
// Expected backend response shape (recommended):
//   {
//     success: true,
//     guestNames: [
//       { id: "<guestId>", name: "john erickson", lastRoom: "N101" },
//       ...
//     ]
//   }
//
// If your backend returns a different shape, the slice will
// normalize it.
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
};

export default residentService;
