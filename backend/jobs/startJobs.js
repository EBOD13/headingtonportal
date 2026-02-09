// backend/jobs/startJobs.js
const MonthlyReportJob = require('./monthlyReportJob');

function startJobs() {
    console.log('Starting scheduled jobs...');
    
    // Start monthly report job
    const monthlyReportJob = new MonthlyReportJob();
    monthlyReportJob.start();
    
    console.log('All jobs started successfully');
}

module.exports = startJobs;