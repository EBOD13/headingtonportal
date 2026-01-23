// check-drive-quota.js
require('dotenv').config();
const path = require('path');
const { google } = require('googleapis');

async function checkDriveQuota() {
  const auth = new google.auth.GoogleAuth({
    keyFile: path.resolve(__dirname, process.env.GOOGLE_APPLICATION_CREDENTIALS),
    scopes: ['https://www.googleapis.com/auth/drive'],
  });
  
  const drive = google.drive({ version: 'v3', auth: await auth.getClient() });
  
  console.log('Checking Drive usage...\n');
  
  try {
    // List all files to see what's taking space
    const files = await drive.files.list({
      pageSize: 100,
      fields: 'files(id, name, mimeType, size, createdTime)',
      orderBy: 'createdTime desc',
    });
    
    console.log(`Total files: ${files.data.files.length}`);
    console.log('\nFiles created by service account:');
    
    let totalSize = 0;
    files.data.files.forEach((file, i) => {
      const size = file.size ? parseInt(file.size) : 0;
      totalSize += size;
      console.log(`${i + 1}. ${file.name} (${file.mimeType}) - ${size} bytes - ${file.createdTime}`);
    });
    
    console.log(`\nTotal storage used: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
    
    // Clean up if needed
    if (files.data.files.length > 0) {
      console.log('\nTo free up space, delete old test files:');
      files.data.files.slice(0, 5).forEach(file => {
        console.log(`  https://drive.google.com/file/d/${file.id}/view`);
      });
    }
    
  } catch (error) {
    console.log('Error:', error.message);
  }
}

checkDriveQuota();