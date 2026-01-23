// test-sheets.js
const { google } = require('googleapis');

async function testPermissions() {
  const auth = new google.auth.GoogleAuth({
    keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive.file',
    ],
  });

  const sheets = google.sheets({ version: 'v4', auth });
  const drive = google.drive({ version: 'v3', auth });

  try {
    // Test 1: Try to create a spreadsheet
    console.log('Testing spreadsheet creation...');
    const response = await sheets.spreadsheets.create({
      resource: {
        properties: { title: 'Test_Permission_Check' },
      },
    });
    console.log('✅ Success! Spreadsheet created:', response.data.spreadsheetId);

    // Test 2: Try to list files from Drive
    console.log('\nTesting Drive permissions...');
    const driveResponse = await drive.files.list({
      pageSize: 5,
      fields: 'files(id, name)',
    });
    console.log('✅ Drive access successful');
    
    return true;
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error.errors || error);
    return false;
  }
}

testPermissions();