// const asyncHandler = require('express-async-handler');
// const Guest = require('../models/guestModel');
// const { Parser } = require('json2csv');

// // GET /api/admin/exports/visitation
// // Query: from, to (ISO) or preset=day|week|month
// const exportVisitationCsv = asyncHandler(async (req, res) => {
//   const { from, to, preset } = req.query;

//   let startDate, endDate;

//   const now = new Date();
//   if (preset) {
//     if (preset === 'day') {
//       startDate = new Date(now);
//       startDate.setHours(0, 0, 0, 0);
//       endDate = new Date(now);
//       endDate.setHours(23, 59, 59, 999);
//     } else if (preset === 'week') {
//       endDate = now;
//       startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
//     } else if (preset === 'month') {
//       endDate = now;
//       startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
//     }
//   } else if (from && to) {
//     startDate = new Date(from);
//     endDate = new Date(to);
//   }

//   if (!startDate || !endDate) {
//     return res.status(400).json({
//       message: 'Provide either preset=day|week|month or valid from/to dates'
//     });
//   }

//   const guests = await Guest.find({
//     checkIn: { $gte: startDate, $lte: endDate }
//   })
//     .populate('host', 'name roomNumber')
//     .lean();

//   const rows = guests.map((g) => ({
//     guest_name: g.name,
//     guest_contact: g.contact,
//     room: g.room,
//     wing: g.wing,
//     host_name: g.host?.name || g.hostName,
//     host_room: g.host?.roomNumber || g.hostRoom,
//     status: g.isCheckedIn ? 'Checked In' : 'Checked Out',
//     check_in: g.checkIn ? new Date(g.checkIn).toISOString() : '',
//     check_out: g.checkout ? new Date(g.checkout).toISOString() : '',
//     flagged: g.flagged ? 'Yes' : 'No',
//     student_at_ou: g.studentAtOU ? 'Yes' : 'No'
//   }));

//   const parser = new Parser();
//   const csv = parser.parse(rows);

//   const fileName = `visitation_${startDate.toISOString().slice(0, 10)}_${endDate
//     .toISOString()
//     .slice(0, 10)}.csv`;

//   res.setHeader('Content-Type', 'text/csv');
//   res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
//   res.status(200).send(csv);
// });

// module.exports = { exportVisitationCsv };


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

  // You can filter on createdAt or checkInTime depending on your schema.
  // We'll use createdAt here as a sane default.
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
    // adjust fields to your schema – these fallbacks are defensive
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
