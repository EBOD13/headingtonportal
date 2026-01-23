// test-sheets-detailed.js
require('dotenv').config();
const path = require('path');
const { google } = require('googleapis');

async function testPermissions() {
  console.log('=== Google Sheets API Test ===\n');
  
  // Resolve the absolute path
  const keyFilePath = path.resolve(__dirname, process.env.GOOGLE_APPLICATION_CREDENTIALS);
  console.log('1. Credentials:');
  console.log('   Path:', keyFilePath);
  
  try {
    // Read service account email
    const creds = require(keyFilePath);
    console.log('   Service account:', creds.client_email);
    
    const auth = new google.auth.GoogleAuth({
      keyFile: keyFilePath,
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive.file',
      ],
    });

    console.log('\n2. Testing authentication...');
    const authClient = await auth.getClient();
    console.log('   ✅ Authentication successful');
    
    const sheets = google.sheets({ version: 'v4', auth: authClient });

    console.log('\n3. Testing spreadsheet creation...');
    try {
      const response = await sheets.spreadsheets.create({
        requestBody: {
          properties: { 
            title: `Test_Permission_${Date.now()}` 
          },
        },
      });
      
      console.log('   ✅ SUCCESS! Spreadsheet created');
      console.log('   Spreadsheet ID:', response.data.spreadsheetId);
      console.log('   URL: https://docs.google.com/spreadsheets/d/' + response.data.spreadsheetId);
      
      // Test Drive API to check permissions
      console.log('\n4. Testing Drive API access...');
      const drive = google.drive({ version: 'v3', auth: authClient });
      
      const driveResponse = await drive.files.list({
        pageSize: 1,
        fields: 'files(id, name, mimeType)',
      });
      
      console.log('   ✅ Drive API accessible');
      console.log('   Found files:', driveResponse.data.files.length);
      
    } catch (createError) {
      console.log('   ❌ Spreadsheet creation failed:', createError.message);
      
      if (createError.code === 403) {
        console.log('\n=== PERMISSION ISSUE DETECTED ===');
        console.log('Service account:', creds.client_email);
        console.log('\nTo fix this:');
        console.log('1. Go to: https://console.cloud.google.com/');
        console.log('2. Navigate to: APIs & Services → Library');
        console.log('3. Enable:');
        console.log('   - Google Sheets API');
        console.log('   - Google Drive API');
        console.log('\n4. Grant Drive permissions:');
        console.log('   - Go to: https://drive.google.com');
        console.log('   - Create a folder (e.g., "Headington Portal")');
        console.log('   - Share it with this email:');
        console.log('     ', creds.client_email);
        console.log('   - Set permission level: "Editor"');
        console.log('\n5. Check IAM permissions:');
        console.log('   - Go to: IAM & Admin → IAM');
        console.log('   - Find:', creds.client_email);
        console.log('   - Ensure it has "Editor" role');
      }
    }
    
  } catch (authError) {
    console.log('   ❌ Authentication failed:', authError.message);
  }
}

testPermissions();