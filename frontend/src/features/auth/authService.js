// frontend/src/features/auth/authService.js
import axios from "axios";

const API_URL = '/api/clerks/';
const ADMIN_API_URL = '/api/admin/clerks/';
const AUTH_API_URL = '/api/auth/';

// ==============================
// Self-registration & login
// ==============================
const register = async (clerkData) => {
  const response = await axios.post(API_URL, clerkData);

  if (response.data) {
    // Self-registration: log them in
    localStorage.setItem("clerk", JSON.stringify(response.data));
  }

  return response.data;
};

const login = async (clerkData) => {
  const response = await axios.post(API_URL + 'login', clerkData);

  if (response.data) {
    localStorage.setItem('clerk', JSON.stringify(response.data));
  }
  return response.data;
};

const logout = () => {
  localStorage.removeItem('clerk');
};

// ==============================
// Admin: create clerk
//  - Uses /api/admin/clerks
//  - DOES NOT log in as that clerk
// ==============================
const adminCreateClerk = async (clerkData, token) => {
  const response = await axios.post(
    ADMIN_API_URL,    // POST /api/admin/clerks
    clerkData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  // Do NOT touch localStorage here.
  // Admin stays logged in as themselves.
  return response.data;
};

// ==============================
// Password set via token (magic link)
// ==============================
const setPasswordWithToken = async (token, data) => {
  const response = await axios.post(
    `${AUTH_API_URL}set-password/${token}`,
    data
  );

  // In this flow, backend can return { token, clerk, message }
  if (response.data) {
    localStorage.setItem('clerk', JSON.stringify(response.data));
  }

  return response.data;
};

// Bundle into a single default export
const authService = {
  register,
  login,
  logout,
  adminCreateClerk,
  setPasswordWithToken,
};

export default authService;
