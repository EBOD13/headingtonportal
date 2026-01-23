// check-specific-quotas.js
require('dotenv').config();
const path = require('path');
const { google } = require('googleapis');

async function checkSpecificQuotas() {
  const auth = new google.auth.GoogleAuth({
    keyFile: path.resolve(__dirname, process.env.GOOGLE_APPLICATION_CREDENTIALS),
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  });
  
  const serviceUsage = google.serviceusage({ version: 'v1', auth: await auth.getClient() });
  const projectId = require(path.resolve(__dirname, process.env.GOOGLE_APPLICATION_CREDENTIALS)).project_id;
  
  console.log('Checking specific quotas for project:', projectId);
  console.log('=========================================\n');
  
  // Common quota metrics to check
  const quotasToCheck = [
    {
      service: 'sheets.googleapis.com',
      metric: 'sheets.googleapis.com/write_requests',
      displayName: 'Sheets Write Requests'
    },
    {
      service: 'drive.googleapis.com',
      metric: 'drive.googleapis.com/requests',
      displayName: 'Drive API Requests'
    },
    {
      service: 'drive.googleapis.com',
      metric: 'drive.googleapis.com/storage',
      displayName: 'Drive Storage'
    }
  ];
  
  try {
    for (const quota of quotasToCheck) {
      console.log(`Checking: ${quota.displayName}`);
      try {
        const response = await serviceUsage.services.consumerQuotaMetrics.limits.get({
          name: `projects/${projectId}/services/${quota.service}/consumerQuotaMetrics/${quota.metric}/limits/-`,
        });
        
        const limit = response.data;
        console.log(`  Limit: ${limit.maxLimit || 'Not specified'}`);
        console.log(`  Usage: ${limit.consumerOverride?.overrideValue || 'Unknown'}`);
        console.log('');
      } catch (error) {
        console.log(`  Could not retrieve: ${error.message}\n`);
      }
    }
    
    console.log('Direct links to check:');
    console.log(`1. Quotas Dashboard: https://console.cloud.google.com/iam-admin/quotas?project=${projectId}`);
    console.log('2. Filter for:');
    console.log('   - "Google Sheets API"');
    console.log('   - "Google Drive API"');
    console.log('3. Look for "Queries per day" and "Queries per 100 seconds"');
    
  } catch (error) {
    console.log('Error:', error.message);
  }
}

checkSpecificQuotas();