// frontend/src/features/admin/adminService.js
import { api } from "../../api/client";

const API_URL = "/api/admin";

// Helper: build auth config
const buildConfig = (token, extra = {}) => ({
  headers: {
    Authorization: `Bearer ${token}`,
    ...(extra.headers || {}),
  },
  ...extra,
});

// ============================
// CLERKS
// ============================

// GET /api/admin/clerks
const getClerkRoster = async (token) => {
  const res = await api.get(`${API_URL}/clerks`, buildConfig(token));
  return res.data;
};

// GET /api/admin/clerks/:id
const getClerkDetail = async (id, token) => {
  const res = await api.get(`${API_URL}/clerks/${id}`, buildConfig(token));
  return res.data;
};

// PUT /api/admin/clerks/:id/status
// body: { isActive?: boolean, role?: string }
const updateClerkStatus = async ({ id, updates }, token) => {
  const res = await api.put(
    `${API_URL}/clerks/${id}/status`,
    updates,
    buildConfig(token)
  );
  return res.data;
};

// DELETE /api/admin/clerks/:id
const deleteClerk = async (id, token) => {
  const res = await api.delete(`${API_URL}/clerks/${id}`, buildConfig(token));
  return res.data;
};

// POST /api/admin/clerks/import (multipart/form-data, field "file")
const importClerksFromFile = async (file, token) => {
  const formData = new FormData();
  formData.append("file", file);

  const res = await api.post(
    `${API_URL}/clerks/import`,
    formData,
    buildConfig(token, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })
  );

  return res.data;
};

// ============================
// RESIDENTS (ADMIN VIEW)
// ============================

// GET /api/admin/residents?search=&wing=&active=&semester=&year=
const getResidentRoster = async (params = {}, token) => {
  const res = await api.get(`${API_URL}/residents`, {
    ...buildConfig(token),
    params,
  });
  return res.data;
};

// PUT /api/admin/residents/:id/status
// body: { active?: boolean }
const updateResidentStatus = async ({ id, updates }, token) => {
  const res = await api.put(
    `${API_URL}/residents/${id}/status`,
    updates,
    buildConfig(token)
  );
  return res.data;
};

// DELETE /api/admin/residents/:id
const deleteResidentAdmin = async (id, token) => {
  const res = await api.delete(
    `${API_URL}/residents/${id}`,
    buildConfig(token)
  );
  return res.data;
};

// POST /api/admin/residents/import
const importResidentsFromFile = async (file, token) => {
  const formData = new FormData();
  formData.append("file", file);

  const res = await api.post(
    `${API_URL}/residents/import`,
    formData,
    buildConfig(token, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })
  );

  return res.data;
};

// ============================
// ACTIVITY (for later)
// ============================

// GET /api/admin/activity?limit=&clerkId=&action=
const getAdminActivity = async (params = {}, token) => {
  const res = await api.get(`${API_URL}/activity`, {
    ...buildConfig(token),
    params,
  });
  return res.data;
};

// ============================
// EXPORT VISITATION CSV (for later)
// ============================

// GET /api/admin/exports/visitation?from=&to=&preset=
const exportVisitationCsv = async (params = {}, token) => {
  const res = await api.get(`${API_URL}/exports/visitation`, {
    ...buildConfig(token, { responseType: "blob" }),
    params,
  });
  // Caller can handle file download
  return res.data;
};

// ============================
// EXPORT OBJECT
// ============================

const adminService = {
  // clerks
  getClerkRoster,
  getClerkDetail,
  updateClerkStatus,
  deleteClerk,
  importClerksFromFile,

  // residents
  getResidentRoster,
  updateResidentStatus,
  deleteResidentAdmin,
  importResidentsFromFile,

  // activity & exports
  getAdminActivity,
  exportVisitationCsv,
};

export default adminService;
