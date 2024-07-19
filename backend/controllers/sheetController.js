const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");
const Clerk = require("../models/clerkModel");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv").config();
const sendMail = require('../notification/emails/registeredClerkEmail');
const { google } = require('googleapis');
const bodyParser = require('body-parser');
const fs = require('fs');

// Define the scope of what we want to work on with Google
const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];
// Load the file containing the Google credential important for establishing a connection with the Google Cloud
const credentials = JSON.parse(fs.readFileSync('./config/google-credentials.json'));

// Set up authentication with Google to work with the spreadsheet
const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: SCOPES,
});
const sheets = google.sheets({ version: 'v4', auth });

// Specify the Google Sheet ID we are working with
const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID;

// Function to read data from the sheet
const readFromSheet = asyncHandler(async (req, res) => {
    try {
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: 'Sheet1!A1:F10',
        });
        res.json(response.data.values);
    } catch (error) {
        console.error('Error reading from Google Sheets:', error);
        res.status(500).send('Error reading from Google Sheets');
    }
});

// Function to append data to the sheet
const appendToSheet = asyncHandler(async (req, res) => {
    try {
        // Extract values from the request body
        const { values } = req.body;

        // Ensure values is an array of arrays
        if (!Array.isArray(values) || !values.every(row => Array.isArray(row))) {
            return res.status(400).json({ error: 'Invalid data format' });
        }

        // Get the current data in the sheet
        const sheetData = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: 'Sheet1!A:A', // Read all data in column A
        });

        const rows = sheetData.data.values || [];
        const lastRowIndex = rows.length; // Last row index

        // Append data after the last row
        await sheets.spreadsheets.values.append({
            spreadsheetId: SPREADSHEET_ID,
            range: `Sheet1!A${lastRowIndex + 1}`, // Start appending from the next row
            valueInputOption: 'RAW',
            resource: { values },
        });

        res.json({ message: 'Data appended successfully' });
    } catch (error) {
        console.error('Error appending data to Google Sheets:', error);
        res.status(500).send('Error appending data to Google Sheets');
    }
});

// Function to get data from the sheet based on range
const getSheetData = async() => {
    try {
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range:'Sheet1'
        });
        return response.data.values;
    } catch (error) {
        console.error('Error fetching data:', error);
        throw error;
    }
};

// Function to update a row based on guest name where checkout time is empty
const updateRow = asyncHandler(async (req, res) => {
    const { guestName, checkoutTime } = req.body;
    try {
      // Fetch data to find the row to update
      const sheetData = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Sheet1!A:F',
      });
  
      console.log('Fetched sheet data:', sheetData.data.values);
  
      const rows = sheetData.data.values || [];
      const rowIndex = rows.findIndex(row => row[1] === guestName && !row[5]); // Assuming column B is guest name and column F is checkout time
  
      if (rowIndex === -1) {
        return res.status(404).json({ error: 'Guest not found or already checked out' });
      }
  
      // Update the specific row with the checkout time
      rows[rowIndex][5] = checkoutTime;
  
      console.log(`Updating row ${rowIndex + 1} with checkout time: ${checkoutTime}`);
  
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `Sheet1!A${rowIndex + 1}:F${rowIndex + 1}`,
        valueInputOption: 'RAW',
        resource: { values: [rows[rowIndex]] },
      });
  
      res.json({ message: 'Checkout time updated successfully' });
    } catch (error) {
      console.error('Error updating row in Google Sheets:', error);
      res.status(500).send('Error updating row in Google Sheets');
    }
  });
  

module.exports = { readFromSheet, appendToSheet, updateRow };
