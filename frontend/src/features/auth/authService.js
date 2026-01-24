// frontend/src/features/auth/authService.js
import { api } from "../../api/client";

const API_URL = '/api/clerks/';
const ADMIN_API_URL = '/api/admin/clerks';
const AUTH_API_URL = '/api/auth/';

// ==============================
// Self-registration & login
// ==============================
const register = async (clerkData) => {
  const response = await api.post(API_URL, clerkData);
  if (response.data) {
    // Self-registration: log them in
    localStorage.setItem("clerk", JSON.stringify(response.data));
  }
  return response.data;
};

const login = async (clerkData) => {
  const response = await api.post(API_URL + 'login', clerkData);
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
  const response = await api.post(
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
  const response = await api.post(
    `${AUTH_API_URL}set-password/${token}`,
    data
  );
  // Backend returns: { message, token, clerk }
  const { clerk, token: jwt, message } = response.data;

  if (!clerk || !jwt) {
    // fallback: just return raw data
    return response.data;
  }

  // Normalize: store a "login-style" clerk object in localStorage
  const loginPayload = {
    ...clerk,   // _id, name, email, role, clerkID, isActive, createdAt
    token: jwt, // attach JWT at top level
  };

  localStorage.setItem('clerk', JSON.stringify(loginPayload));
  return loginPayload;
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