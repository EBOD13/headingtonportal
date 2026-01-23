// // frontend/src/features/guests/guestService.js
// import axios from 'axios';

// const API_URL = '/api/guests/';

// // Small helper for auth header
// const buildConfig = (token) => {
//   return {
//     headers: {
//       Authorization: `Bearer ${token}`,
//     },
//   };
// };

// // ==============================
// // registerGuest
// // POST /api/guests/register
// // ==============================
// const registerGuest = async (guestData, token) => {
//   console.log('[guestService] registerGuest → payload:', guestData);

//   const config = buildConfig(token);

//   const response = await axios.post(
//     `${API_URL}register`,
//     guestData,
//     config
//   );

//   console.log('[guestService] registerGuest ← response.data:', response.data);
//   return response.data;
// };

// // ==============================
// // getCheckedInGuests
// // GET /api/guests/allguests
// // returns { success, rooms, guests, count }
// // ==============================
// const getCheckedInGuests = async (token) => {
//   console.log('[guestService] getCheckedInGuests →');

//   const config = buildConfig(token);

//   const response = await axios.get(
//     `${API_URL}allguests`,
//     config
//   );

//   console.log('[guestService] getCheckedInGuests ← response.data:', response.data);
//   return response.data;
// };

// // ==============================
// // getAllGuests
// // GET /api/guests
// // backend returns: { success, count, guests }
// // ==============================
// const getAllGuests = async (token) => {
//   console.log('[guestService] getAllGuests →');

//   const config = buildConfig(token);

//   try {
//     const response = await axios.get(API_URL, config);
//     console.log('[guestService] getAllGuests ← response.data:', response.data);
//     return response.data;
//   } catch (error) {
//     console.error('[guestService] getAllGuests error:', error);
//     throw error;
//   }
// };

// // ==============================
// // checkInGuest
// // PUT /api/guests/checkin/:guestId
// // ==============================
// const checkInGuest = async (guestId, token) => {
//   console.log('[guestService] checkInGuest → guestId:', guestId);

//   const config = buildConfig(token);

//   const response = await axios.put(
//     `${API_URL}checkin/${guestId}`,
//     {},
//     config
//   );

//   console.log('[guestService] checkInGuest ← response.data:', response.data);
//   return response.data;
// };

// // ==============================
// // checkOutGuest
// // PUT /api/guests/checkout/:guestId
// // ==============================
// const checkOutGuest = async (guestId, token) => {
//   console.log('[guestService] checkOutGuest → guestId:', guestId);

//   const config = buildConfig(token);

//   const response = await axios.put(
//     `${API_URL}checkout/${guestId}`,
//     {},
//     config
//   );

//   console.log('[guestService] checkOutGuest ← response.data:', response.data);
//   return response.data;
// };

// // ==============================
// // Default export
// // ==============================
// const guestService = {
//   registerGuest,
//   getCheckedInGuests,
//   getAllGuests,
//   checkInGuest,
//   checkOutGuest,
// };

// export default guestService;

// frontend/src/features/guests/guestService.js
import axios from 'axios';

const API_URL = '/api/guests/';

const buildConfig = (token) => ({
  headers: { Authorization: `Bearer ${token}` }
});

// Get all guests
const getAllGuests = async (token) => {
  const response = await axios.get(API_URL, buildConfig(token));
  return response.data;
};

// Get checked-in guests
const getCheckedInGuests = async (token) => {
  const response = await axios.get(`${API_URL}allguests`, buildConfig(token));
  return response.data;
};

// Register guest
const registerGuest = async (guestData, token) => {
  const response = await axios.post(`${API_URL}register`, guestData, buildConfig(token));
  return response.data;
};

// Check-in guest
const checkInGuest = async (guestId, token) => {
  const response = await axios.put(`${API_URL}checkin/${guestId}`, {}, buildConfig(token));
  return response.data;
};

// Check-out guest
const checkOutGuest = async (guestId, token) => {
  const response = await axios.put(`${API_URL}checkout/${guestId}`, {}, buildConfig(token));
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