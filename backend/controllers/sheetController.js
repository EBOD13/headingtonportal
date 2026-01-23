// backend/controllers/sheetController.js
const asyncHandler = require('express-async-handler');
const { google } = require('googleapis');
const VisitorLogConfig = require('../models/visitorLogConfigModel');

// =====================================
// Google Sheets setup
// =====================================

// Scope: full access to spreadsheets
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive.file',];

// Uses GOOGLE_APPLICATION_CREDENTIALS from .env
// e.g. GOOGLE_APPLICATION_CREDENTIALS=./config/google-credentials.json
const auth = new google.auth.GoogleAuth({
  keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  scopes: SCOPES,
});

const sheets = google.sheets({ version: 'v4', auth });

// =====================================
// Helpers: academic year & wing
// =====================================

// Adjust if you want an academic year that starts in August, etc.
function getCurrentAcademicYear() {
  const now = new Date();
  return now.getFullYear();
}

// Decide tab name based on room number prefix
function getWingFromRoom(roomNumber) {
  if (!roomNumber || typeof roomNumber !== 'string') {
    return 'North wing'; // default fallback
  }

  const first = roomNumber.trim()[0].toUpperCase();
  if (first === 'N') return 'North wing';
  if (first === 'S') return 'South wing';
  return 'North wing'; // fallback
}

// Ensure a spreadsheet exists for the given year.
// If not, create it with "North wing" and "South wing" sheets.
async function ensureSpreadsheetForYear(year) {
  // 1) Check Mongo
  let config = await VisitorLogConfig.findOne({ year });
  if (config) return config.spreadsheetId;

  const title = `HH_VisitorLog_${year}`;

  // 2) Create new spreadsheet
  const response = await sheets.spreadsheets.create({
    resource: {
      properties: { title },
      sheets: [
        { properties: { title: 'North wing' } },
        { properties: { title: 'South wing' } },
      ],
    },
  });

  const spreadsheetId = response.data.spreadsheetId;

  // 3) Store mapping
  config = await VisitorLogConfig.create({ year, spreadsheetId });

  return config.spreadsheetId;
}

// =====================================
// Controller functions
// =====================================

/**
 * GET /api/sheets/read
 * Optional query params:
 *  - year: number (defaults to current academic year)
 *  - wing: "North wing" | "South wing" (defaults to "North wing")
 *  - range: A1 notation range (defaults to `${wing}!A1:F50`)
 */
const readFromSheet = asyncHandler(async (req, res) => {
  try {
    const year = req.query.year ? Number(req.query.year) : getCurrentAcademicYear();
    const spreadsheetId = await ensureSpreadsheetForYear(year);

    const wing = req.query.wing || 'North wing';
    const range = req.query.range || `${wing}!A1:F50`;

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    res.json(response.data.values || []);
  } catch (error) {
    console.error('Error reading from Google Sheets:', error);
    res.status(500).send('Error reading from Google Sheets');
  }
});

/**
 * POST /api/sheets/append
 * Body:
 *  - values: array of arrays [[col1, col2, ...], ...]  (required)
 *  - roomNumber: string (optional but recommended; used to pick North/South wing)
 *  - year: number (optional; defaults to current academic year)
 */
const appendToSheet = asyncHandler(async (req, res) => {
  try {
    const { values, roomNumber, year } = req.body;

    // Ensure values is an array of arrays
    if (!Array.isArray(values) || !values.every((row) => Array.isArray(row))) {
      return res.status(400).json({ error: 'Invalid data format (values must be array of arrays)' });
    }

    const effectiveYear = year ? Number(year) : getCurrentAcademicYear();
    const spreadsheetId = await ensureSpreadsheetForYear(effectiveYear);

    const sheetName = getWingFromRoom(roomNumber);

    // Read column A to figure out the next row
    const sheetData = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A:A`,
    });

    const rows = sheetData.data.values || [];
    const lastRowIndex = rows.length;

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${sheetName}!A${lastRowIndex + 1}`,
      valueInputOption: 'RAW',
      resource: { values },
    });

    res.json({ message: 'Data appended successfully' });
  } catch (error) {
    console.error('Error appending data to Google Sheets:', error);
    res.status(500).send('Error appending data to Google Sheets');
  }
});

/**
 * PUT /api/sheets/update
 * Body:
 *  - guestName: string   (required)
 *  - checkoutTime: string (required)
 *  - year: number (optional; defaults to current academic year)
 *
 * Behavior:
 *  - Searches BOTH "North wing" and "South wing" sheets for a row where:
 *      column B === guestName AND column F is empty (no checkout time yet)
 *  - When found, sets column F to checkoutTime and updates that row.
 */
const updateRow = asyncHandler(async (req, res) => {
  const { guestName, checkoutTime, year } = req.body;

  if (!guestName || !checkoutTime) {
    return res.status(400).json({ error: 'guestName and checkoutTime are required' });
  }

  try {
    const effectiveYear = year ? Number(year) : getCurrentAcademicYear();
    const spreadsheetId = await ensureSpreadsheetForYear(effectiveYear);

    const wingsToSearch = ['North wing', 'South wing'];

    for (const wing of wingsToSearch) {
      const sheetData = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${wing}!A:F`,
      });

      const rows = sheetData.data.values || [];
      const rowIndex = rows.findIndex((row) => row[1] === guestName && !row[5]);

      if (rowIndex !== -1) {
        // Update the specific row with the checkout time (column F is index 5)
        rows[rowIndex][5] = checkoutTime;

        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `${wing}!A${rowIndex + 1}:F${rowIndex + 1}`,
          valueInputOption: 'RAW',
          resource: { values: [rows[rowIndex]] },
        });

        return res.json({
          message: `Checkout time updated successfully in ${wing} (row ${rowIndex + 1})`,
        });
      }
    }

    // If we reach here, not found in any wing
    return res.status(404).json({ error: 'Guest not found or already checked out' });
  } catch (error) {
    console.error('Error updating row in Google Sheets:', error);
    res.status(500).send('Error updating row in Google Sheets');
  }
});

// If you still need a helper to read all sheet data for some internal use:
const getSheetData = async (year, wing = 'North wing') => {
  const effectiveYear = year ? Number(year) : getCurrentAcademicYear();
  const spreadsheetId = await ensureSpreadsheetForYear(effectiveYear);

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${wing}!A:F`,
  });

  return response.data.values;
};

module.exports = {
  readFromSheet,
  appendToSheet,
  updateRow,
  getSheetData,
};
