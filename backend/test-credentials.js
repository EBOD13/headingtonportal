// test-credentials.js
require('dotenv').config();
const path = require('path');
const fs = require('fs');

console.log('Checking environment and credentials...\n');

// 1. Check if .env is loaded
console.log('1. Environment variables:');
console.log('   GOOGLE_APPLICATION_CREDENTIALS:', process.env.GOOGLE_APPLICATION_CREDENTIALS);
console.log('   NODE_ENV:', process.env.NODE_ENV);
console.log('   MONGODB_URI:', process.env.MONGODB_URI ? '✓ Set' : '✗ Not set');

// 2. Check if the credentials file exists
if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  const credentialsPath = path.resolve(process.env.GOOGLE_APPLICATION_CREDENTIALS);
  console.log('\n2. Credentials file:');
  console.log('   Path from env:', process.env.GOOGLE_APPLICATION_CREDENTIALS);
  console.log('   Resolved path:', credentialsPath);
  console.log('   File exists:', fs.existsSync(credentialsPath) ? '✓ YES' : '✗ NO');
  
  if (fs.existsSync(credentialsPath)) {
    try {
      const creds = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
      console.log('   Service account email:', creds.client_email);
      console.log('   Private key present:', creds.private_key ? '✓ YES' : '✗ NO');
    } catch (err) {
      console.log('   Error reading file:', err.message);
    }
  }
} else {
  console.log('\n2. GOOGLE_APPLICATION_CREDENTIALS not set in .env');
}

// 3. Try to load auth directly
console.log('\n3. Testing direct auth load...');
try {
  const { google } = require('googleapis');
  
  // Method 1: Using keyFile
  console.log('   Method 1: Using keyFile...');
  const auth1 = new google.auth.GoogleAuth({
    keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  console.log('   ✓ Auth created with keyFile');
  
  // Method 2: Using GOOGLE_APPLICATION_CREDENTIALS env var
  console.log('   Method 2: Using environment variable...');
  process.env.GOOGLE_APPLICATION_CREDENTIALS = path.resolve(process.env.GOOGLE_APPLICATION_CREDENTIALS);
  const auth2 = new google.auth.GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  console.log('   ✓ Auth created with env var');
  
} catch (err) {
  console.log('   ✗ Error:', err.message);
}