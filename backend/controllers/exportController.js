// backend/controllers/exportController.js
const asyncHandler = require('express-async-handler');
const Guest = require('../models/guestModel');

// Utility: CSV-safe value
function csvValue(value) {
  if (value === null || value === undefined) return '';
  const s = String(value);
  if (s.includes('"') || s.includes(',') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

// Utility: format date safely
function formatDate(d) {
  if (!d) return '';
  try {
    const date = d instanceof Date ? d : new Date(d);
    if (Number.isNaN(date.getTime())) return '';
    return date.toISOString();
  } catch (_) {
    return '';
  }
}

/**
 * GET /api/admin/exports/visitation
 *
 * Query:
 *   - from: ISO date string (optional)
 *   - to:   ISO date string (optional)
 *   - preset: 'today' | 'week' | 'month' (optional, used if from/to not provided)
 *
 * Returns: CSV file with visitation log.
 */
const exportVisitationCsv = asyncHandler(async (req, res) => {
  let { from, to, preset } = req.query;

  const now = new Date();
  let start = from ? new Date(from) : null;
  let end = to ? new Date(to) : null;

  // If no explicit range, allow presets (today / week / month)
  if (!start && !end && preset) {
    const d = new Date(now);
    switch (preset) {
      case 'today': {
        start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
        end = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
        break;
      }
      case 'week': {
        // last 7 days
        start = new Date(d.getTime() - 7 * 24 * 60 * 60 * 1000);
        end = now;
        break;
      }
      case 'month': {
        start = new Date(d.getFullYear(), d.getMonth(), 1);
        end = now;
        break;
      }
      default:
        break;
    }
  }

  const filter = {};
  if (start || end) {
    filter.createdAt = {};
    if (start && !Number.isNaN(start.getTime())) {
      filter.createdAt.$gte = start;
    }
    if (end && !Number.isNaN(end.getTime())) {
      filter.createdAt.$lte = end;
    }
  }

  // Fetch visits
  const visits = await Guest.find(filter)
    .sort({ createdAt: -1 })
    .lean();

  // Build CSV rows
  const header = [
    'Guest Name',
    'Host',
    'Room',
    'Check In',
    'Check Out',
    'Notes',
  ];

  const rows = visits.map((v) => {
    const guestName = v.name || v.guestName || '';
    const hostName = v.hostName || v.host?.name || v.host || '';
    const room = v.room || v.roomNumber || '';
    const checkIn =
      formatDate(v.checkInTime || v.timeIn || v.createdAt);
    const checkOut = formatDate(v.checkOutTime || v.timeOut);
    const notes = v.notes || v.reason || '';

    return [
      csvValue(guestName),
      csvValue(hostName),
      csvValue(room),
      csvValue(checkIn),
      csvValue(checkOut),
      csvValue(notes),
    ].join(',');
  });

  const csv = [header.map(csvValue).join(','), ...rows].join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader(
    'Content-Disposition',
    'attachment; filename="visitation_log.csv"'
  );

  return res.status(200).send(csv);
});

module.exports = {
  exportVisitationCsv,
};
