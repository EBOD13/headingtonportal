const asyncHandler = require('express-async-handler');
const ExcelJS = require('exceljs'); // Changed from xlsx
const fs = require('fs');
const path = require('path');

const Resident = require('../models/residentModel');
const Clerk = require('../models/clerkModel');
const { logActivity } = require('../utils/activityLogger');

// Helper: read excel/csv into array of row objects
async function parseUploadFile(filePath) {
  const workbook = new ExcelJS.Workbook();
  
  // Determine file type by extension
  const ext = path.extname(filePath).toLowerCase();
  
  try {
    if (ext === '.xlsx' || ext === '.xlsm' || ext === '.xlsb') {
      await workbook.xlsx.readFile(filePath);
    } else if (ext === '.xls') {
      await workbook.xls.readFile(filePath);
    } else if (ext === '.csv') {
      // For CSV files
      await workbook.csv.readFile(filePath, {
        parserOptions: {
          delimiter: ','
        }
      });
    } else {
      // Try to read as xlsx by default
      await workbook.xlsx.readFile(filePath);
    }
    
    // Get the first worksheet
    const worksheet = workbook.worksheets[0];
    
    if (!worksheet) {
      throw new Error('No worksheets found in file');
    }
    
    // Convert worksheet to JSON array
    const json = [];
    
    // Get headers from first row
    const headerRow = worksheet.getRow(1);
    const headers = [];
    
    headerRow.eachCell((cell, colNumber) => {
      headers[colNumber - 1] = (cell.value || '').toString().trim();
    });
    
    // Process data rows
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Skip header row
      
      const rowData = {};
      row.eachCell((cell, colNumber) => {
        const header = headers[colNumber - 1];
        if (header) {
          // Get cell value, handling various ExcelJS value types
          let value = cell.value;
          
          // Handle ExcelJS specific types
          if (cell.value && typeof cell.value === 'object') {
            // For formulas, get the result
            if (cell.value.formula) {
              value = cell.value.result || '';
            }
            // For rich text
            else if (cell.value.richText) {
              value = cell.value.richText.map(rt => rt.text).join('');
            }
            // For other object types, stringify
            else {
              value = cell.value.toString();
            }
          }
          
          // Convert to string and trim
          rowData[header] = value !== null && value !== undefined 
            ? value.toString().trim() 
            : '';
        }
      });
      
      // Only add row if it has data (not empty)
      if (Object.keys(rowData).length > 0) {
        json.push(rowData);
      }
    });
    
    return json;
    
  } catch (error) {
    // Fallback: try reading as CSV if Excel reading fails
    if (error.message.includes('file appears to be corrupted')) {
      try {
        const workbook = new ExcelJS.Workbook();
        await workbook.csv.readFile(filePath);
        const worksheet = workbook.worksheets[0];
        
        const json = [];
        const headerRow = worksheet.getRow(1);
        const headers = [];
        
        headerRow.eachCell((cell, colNumber) => {
          headers[colNumber - 1] = (cell.value || '').toString().trim();
        });
        
        worksheet.eachRow((row, rowNumber) => {
          if (rowNumber === 1) return;
          
          const rowData = {};
          row.eachCell((cell, colNumber) => {
            const header = headers[colNumber - 1];
            if (header) {
              rowData[header] = (cell.value || '').toString().trim();
            }
          });
          
          if (Object.keys(rowData).length > 0) {
            json.push(rowData);
          }
        });
        
        return json;
      } catch (csvError) {
        throw new Error(`Failed to parse file as Excel or CSV: ${error.message}`);
      }
    }
    throw error;
  }
}

// For clerks without password → generate temp password
function generateRandomPassword(length = 10) {
  const chars =
    'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
  let pwd = '';
  for (let i = 0; i < length; i++) {
    pwd += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pwd;
}

// =============================
// IMPORT RESIDENTS
// =============================
//
// Expected columns (case-insensitive, header row):
// - Name
// - RoomNumber
// - Email
// - PhoneNumber
// - StudentID
// - Semester (optional: Spring/Summer/Fall)
// - Year (optional)
// - Active (optional: true/false/yes/no/1/0)
const importResidentsFromFile = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  const filePath = req.file.path;
  let rows;

  try {
    rows = await parseUploadFile(filePath);
  } catch (err) {
    fs.unlinkSync(filePath);
    return res.status(400).json({ message: 'Failed to parse file', error: err.message });
  }

  // Validate that we got data
  if (!rows || rows.length === 0) {
    fs.unlinkSync(filePath);
    return res.status(400).json({ message: 'No data found in file' });
  }

  const results = [];
  let successCount = 0;
  let errorCount = 0;

  for (let index = 0; index < rows.length; index++) {
    const row = rows[index];
    const rowNumber = index + 2;

    const name = (row.Name || row.name || '').toString().trim();
    const roomNumber = (row.RoomNumber || row.roomNumber || '').toString().trim();
    const email = (row.Email || row.email || '').toString().trim().toLowerCase();
    const phoneNumber = (row.PhoneNumber || row.phoneNumber || '').toString().trim();
    const studentID = (row.StudentID || row.studentID || '').toString().trim();

    let semester = (row.Semester || row.semester || '').toString().trim();
    let year = (row.Year || row.year || '').toString().trim();
    let active = (row.Active || row.active || '').toString().trim();

    // Basic validation
    if (!name || !roomNumber || !email || !phoneNumber || !studentID) {
      errorCount++;
      results.push({
        row: rowNumber,
        status: 'error',
        message: 'Missing required fields (Name, RoomNumber, Email, PhoneNumber, StudentID)'
      });
      continue;
    }

    // Normalize
    const normalizedRoom = roomNumber.toUpperCase();
    if (!/^[NS]\d{3}$/.test(normalizedRoom)) {
      errorCount++;
      results.push({
        row: rowNumber,
        status: 'error',
        message: `Invalid room number format: ${roomNumber}`
      });
      continue;
    }

    if (semester) {
      const validSemester = ['Spring', 'Summer', 'Fall'];
      const normalizedSem = semester.charAt(0).toUpperCase() + semester.slice(1).toLowerCase();
      if (!validSemester.includes(normalizedSem)) {
        errorCount++;
        results.push({
          row: rowNumber,
          status: 'error',
          message: `Invalid semester: ${semester} (use Spring/Summer/Fall)`
        });
        continue;
      }
      semester = normalizedSem;
    } else {
      semester = undefined;
    }

    if (year) {
      const y = parseInt(year, 10);
      if (isNaN(y) || y < 2000 || y > 2100) {
        errorCount++;
        results.push({
          row: rowNumber,
          status: 'error',
          message: `Invalid year: ${year}`
        });
        continue;
      }
      year = y;
    } else {
      year = undefined;
    }

    if (active) {
      const val = active.toLowerCase();
      active = ['true', 'yes', '1'].includes(val);
    } else {
      active = true;
    }

    try {
      // Avoid duplicates by email
      const existing = await Resident.findOne({ email });
      if (existing) {
        errorCount++;
        results.push({
          row: rowNumber,
          status: 'skipped',
          message: `Resident with email ${email} already exists`
        });
        continue;
      }

      const resident = await Resident.create({
        name,
        roomNumber: normalizedRoom,
        email,
        phoneNumber,
        studentID, 
        active,
        semester,
        year
      });

      successCount++;
      results.push({
        row: rowNumber,
        status: 'success',
        residentId: resident._id
      });

      // activity log per resident
      if (req.clerk) {
        await logActivity({
          actorId: req.clerk._id,
          action: 'resident_created',
          targetType: 'resident',
          targetId: resident._id,
          description: `Resident created via import: ${resident.name} (${resident.roomNumber})`,
          metadata: { rowNumber }
        });
      }
    } catch (err) {
      console.error('Error importing resident row', rowNumber, err.message);
      errorCount++;
      results.push({
        row: rowNumber,
        status: 'error',
        message: err.message
      });
    }
  }

  fs.unlinkSync(filePath);

  res.status(200).json({
    message: 'Resident import complete',
    totalRows: rows.length,
    successCount,
    errorCount,
    results
  });
});

// =============================
// IMPORT CLERKS
// =============================
//
// Expected columns (case-insensitive):
// - Name
// - Email
// - Role (optional: admin/supervisor/clerk/trainee)
// - IsActive (optional)
// - Password (optional; if blank we autogenerate)
const importClerksFromFile = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  const filePath = req.file.path;
  let rows;

  try {
    rows = await parseUploadFile(filePath);
  } catch (err) {
    fs.unlinkSync(filePath);
    return res.status(400).json({ message: 'Failed to parse file', error: err.message });
  }

  // Validate that we got data
  if (!rows || rows.length === 0) {
    fs.unlinkSync(filePath);
    return res.status(400).json({ message: 'No data found in file' });
  }

  const results = [];
  let successCount = 0;
  let errorCount = 0;

  for (let index = 0; index < rows.length; index++) {
    const row = rows[index];
    const rowNumber = index + 2;

    const name = (row.Name || row.name || '').toString().trim();
    const email = (row.Email || row.email || '').toString().trim().toLowerCase();
    let role = (row.Role || row.role || '').toString().trim();
    let isActive = (row.IsActive || row.isActive || '').toString().trim();
    let password = (row.Password || row.password || '').toString().trim();

    if (!name || !email) {
      errorCount++;
      results.push({
        row: rowNumber,
        status: 'error',
        message: 'Missing required fields (Name, Email)'
      });
      continue;
    }

    const validRoles = ['admin', 'supervisor', 'clerk', 'trainee'];
    if (!role) {
      role = 'clerk';
    } else {
      const normalizedRole = role.toLowerCase();
      if (!validRoles.includes(normalizedRole)) {
        errorCount++;
        results.push({
          row: rowNumber,
          status: 'error',
          message: `Invalid role: ${role}`
        });
        continue;
      }
      role = normalizedRole;
    }

    if (isActive) {
      const val = isActive.toLowerCase();
      isActive = ['true', 'yes', '1'].includes(val);
    } else {
      isActive = true;
    }

    if (!password) {
      password = generateRandomPassword();
    }

    try {
      const existing = await Clerk.findOne({ email });
      if (existing) {
        errorCount++;
        results.push({
          row: rowNumber,
          status: 'skipped',
          message: `Clerk with email ${email} already exists`
        });
        continue;
      }

      const clerk = await Clerk.create({
        name,
        email,
        password,
        role,
        isActive,
        // baseline permissions; admin/supervisor can tune later
        permissions:
          role === 'admin'
            ? [
                'view_residents',
                'edit_residents',
                'delete_residents',
                'view_guests',
                'check_in_guests',
                'check_out_guests',
                'view_reports',
                'generate_reports',
                'manage_clerks',
                'system_settings'
              ]
            : ['view_guests', 'check_in_guests', 'check_out_guests', 'view_residents']
      });

      successCount++;
      results.push({
        row: rowNumber,
        status: 'success',
        clerkId: clerk._id
      });

      if (req.clerk) {
        await logActivity({
          actorId: req.clerk._id,
          action: 'clerk_created',
          targetType: 'clerk',
          targetId: clerk._id,
          description: `Clerk created via import: ${clerk.email}`,
          metadata: { rowNumber, role }
        });
      }

    } catch (err) {
      console.error('Error importing clerk row', rowNumber, err.message);
      errorCount++;
      results.push({
        row: rowNumber,
        status: 'error',
        message: err.message
      });
    }
  }

  fs.unlinkSync(filePath);

  res.status(200).json({
    message: 'Clerk import complete',
    totalRows: rows.length,
    successCount,
    errorCount,
    results
  });
});

module.exports = {
  importResidentsFromFile,
  importClerksFromFile
};