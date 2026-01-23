// debug-permissions.js
require('dotenv').config();
const path = require('path');
const { google } = require('googleapis');

async function debugPermissions() {
  console.log('=== Detailed Permission Debug ===\n');
  
  const keyFilePath = path.resolve(__dirname, process.env.GOOGLE_APPLICATION_CREDENTIALS);
  const creds = require(keyFilePath);
  
  console.log('1. Service Account Info:');
  console.log('   Email:', creds.client_email);
  console.log('   Project ID:', creds.project_id);
  console.log('   Private Key ID:', creds.private_key_id);
  
  const auth = new google.auth.GoogleAuth({
    keyFile: keyFilePath,
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive',
    ],
  });
  
  try {
    const authClient = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: authClient });
    const drive = google.drive({ version: 'v3', auth: authClient });
    
    console.log('\n2. Testing Drive API permissions...');
    
    // Test 1: Can we list files?
    try {
      const driveList = await drive.files.list({
        pageSize: 5,
        fields: 'files(id, name, mimeType, owners)',
      });
      console.log('   ✅ Can list files');
      console.log('   Files found:', driveList.data.files.length);
      
      if (driveList.data.files.length > 0) {
        console.log('   First file:', driveList.data.files[0].name);
      }
    } catch (driveError) {
      console.log('   ❌ Cannot list files:', driveError.message);
    }
    
    // Test 2: Can we create a folder?
    console.log('\n3. Testing folder creation...');
    try {
      const folderMetadata = {
        name: `Headington_Portal_Test_${Date.now()}`,
        mimeType: 'application/vnd.google-apps.folder',
      };
      
      const folder = await drive.files.create({
        requestBody: folderMetadata,
        fields: 'id, name',
      });
      console.log('   ✅ Can create folders');
      console.log('   Created folder ID:', folder.data.id);
      console.log('   Created folder name:', folder.data.name);
    } catch (folderError) {
      console.log('   ❌ Cannot create folders:', folderError.message);
      console.log('   Error code:', folderError.code);
    }
    
    // Test 3: Try to create spreadsheet in Drive (not just Sheets API)
    console.log('\n4. Testing spreadsheet creation via Drive API...');
    try {
      const spreadsheetMetadata = {
        name: `HH_Test_${Date.now()}`,
        mimeType: 'application/vnd.google-apps.spreadsheet',
      };
      
      const spreadsheet = await drive.files.create({
        requestBody: spreadsheetMetadata,
        fields: 'id, name',
      });
      console.log('   ✅ Can create spreadsheets via Drive API');
      console.log('   Created spreadsheet ID:', spreadsheet.data.id);
    } catch (driveCreateError) {
      console.log('   ❌ Cannot create via Drive API:', driveCreateError.message);
    }
    
    // Test 4: Try the Sheets API create directly
    console.log('\n5. Testing Sheets API create...');
    try {
      const sheetsCreate = await sheets.spreadsheets.create({
        requestBody: {
          properties: { 
            title: `HH_SheetsAPI_Test_${Date.now()}` 
          },
        },
      });
      console.log('   ✅ Sheets API create works!');
      console.log('   Spreadsheet ID:', sheetsCreate.data.spreadsheetId);
      console.log('   URL: https://docs.google.com/spreadsheets/d/' + sheetsCreate.data.spreadsheetId);
      
      // Share it back to yourself to verify
      console.log('\n6. Testing sharing permissions...');
      await drive.permissions.create({
        fileId: sheetsCreate.data.spreadsheetId,
        requestBody: {
          role: 'writer',
          type: 'user',
          emailAddress: creds.client_email, // Share with itself
        },
      });
      console.log('   ✅ Can set permissions');
      
    } catch (sheetsError) {
      console.log('   ❌ Sheets API create failed:', sheetsError.message);
      
      // Check for specific error details
      if (sheetsError.errors) {
        console.log('   Error details:');
        sheetsError.errors.forEach((err, i) => {
          console.log(`     ${i + 1}. ${err.message} (${err.domain}/${err.reason})`);
        });
      }
      
      console.log('\n=== TROUBLESHOOTING STEPS ===');
      console.log('\nA. Grant Drive permissions to service account:');
      console.log('   1. Go to https://drive.google.com');
      console.log('   2. Click "New" → "Folder" (create "Headington Portal")');
      console.log('   3. Right-click folder → "Share"');
      console.log('   4. Add:', creds.client_email);
      console.log('   5. Set as "Editor"');
      
      console.log('\nB. Check IAM roles:');
      console.log('   1. Go to https://console.cloud.google.com/iam-admin/iam');
      console.log('   2. Find service account:', creds.client_email);
      console.log('   3. Ensure it has "Editor" role at project level');
      
      console.log('\nC. Check domain-wide delegation (if using Google Workspace):');
      console.log('   1. Google Admin Console → Security → API controls');
      console.log('   2. Add client ID:', creds.client_id);
      console.log('   3. Add scopes:', [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive',
      ]);
      
      console.log('\nD. Temporary workaround:');
      console.log('   1. Create spreadsheet manually');
      console.log('   2. Share with:', creds.client_email);
      console.log('   3. Use that spreadsheet ID in code');
    }
    
  } catch (authError) {
    console.log('Authentication error:', authError.message);
  }
}

debugPermissions();