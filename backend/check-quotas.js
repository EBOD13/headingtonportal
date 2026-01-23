// check-quotas.js
require('dotenv').config();
const path = require('path');
const { google } = require('googleapis');

async function checkQuotas() {
  const auth = new google.auth.GoogleAuth({
    keyFile: path.resolve(__dirname, process.env.GOOGLE_APPLICATION_CREDENTIALS),
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  });
  
  const serviceUsage = google.serviceusage({ version: 'v1', auth: await auth.getClient() });
  
  console.log('Checking Google Cloud quotas...\n');
  
  const projectId = require(credentialsPath).project_id;
  
  try {
    // Check Sheets API
    console.log('1. Google Sheets API:');
    const sheetsQuota = await serviceUsage.services.get({
      name: `projects/${projectId}/services/sheets.googleapis.com`,
    });
    console.log('   Status:', sheetsQuota.data.state);
    
    // Check Drive API
    console.log('\n2. Google Drive API:');
    const driveQuota = await serviceUsage.services.get({
      name: `projects/${projectId}/services/drive.googleapis.com`,
    });
    console.log('   Status:', driveQuota.data.state);
    
    console.log('\n3. Check quota dashboard:');
    console.log(`   https://console.cloud.google.com/iam-admin/quotas?project=${projectId}`);
    
    console.log('\n4. Common quota issues:');
    console.log('   • Drive API requests per day');
    console.log('   • Drive storage per project');
    console.log('   • Sheets API requests per minute');
    
  } catch (error) {
    console.log('Error checking quotas:', error.message);
    console.log('\nDirect links:');
    console.log('1. Quotas: https://console.cloud.google.com/iam-admin/quotas');
    console.log('2. APIs: https://console.cloud.google.com/apis/dashboard');
    console.log('3. Billing: https://console.cloud.google.com/billing');
  }
}

const credentialsPath = path.resolve(__dirname, process.env.GOOGLE_APPLICATION_CREDENTIALS);
checkQuotas();