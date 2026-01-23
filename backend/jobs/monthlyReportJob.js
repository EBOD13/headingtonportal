// backend/jobs/monthlyReportJob.js
const cron = require('node-cron');
const mongoose = require('mongoose');
const Guest = require('../models/guestModel');
const ExcelReportGenerator = require('../utils/excelGenerator');
const EmailService = require('../utils/emailService');
const fs = require('fs');
const path = require('path');

class MonthlyReportJob {
    constructor() {
        this.excelGenerator = new ExcelReportGenerator();
        this.emailService = new EmailService();
    }

    start() {
        // Run on the last day of each month at 11:59 PM
        cron.schedule('59 23 28-31 * *', () => {
            console.log('Running monthly report job...');
            this.execute();
        }, {
            scheduled: true,
            timezone: "America/Chicago" // Oklahoma time
        });

        console.log('Monthly report scheduler started');
    }

    async execute() {
        try {
            const now = new Date();
            const year = now.getFullYear();
            const month = now.getMonth() + 1; // 1-12
            
            // Get the first and last day of the month
            const firstDay = new Date(year, month - 1, 1);
            const lastDay = new Date(year, month, 0, 23, 59, 59, 999);
            
            console.log(`Generating report for ${month}/${year}`);
            
            // Fetch guests for this month
            const guests = await Guest.find({
                checkIn: { $gte: firstDay, $lte: lastDay }
            }).populate({
                path: 'host',
                select: 'name roomNumber',
                model: 'Resident'
            });
            
            // Add host info to guests for the report
            const guestsWithHostInfo = guests.map(guest => {
                const guestObj = guest.toObject();
                if (guest.host) {
                    guestObj.hostName = guest.host.name;
                    guestObj.hostRoom = guest.host.roomNumber;
                }
                return guestObj;
            });
            
            if (guestsWithHostInfo.length === 0) {
                console.log('No guests found for this month');
                return;
            }
            
            // Generate Excel report
            const { filePath, fileName } = await this.excelGenerator.generateMonthlyReport(
                guestsWithHostInfo,
                year,
                month
            );
            
            // Send email with attachment
            const emailResult = await this.emailService.sendMonthlyReport(
                filePath,
                fileName,
                year,
                month
            );
            
            if (emailResult.success) {
                console.log(`Monthly report for ${month}/${year} completed and emailed`);
                
                // Archive the report (keep last 12 months)
                this.archiveReport(filePath, year, month);
            } else {
                console.error('Failed to email report:', emailResult.error);
            }
            
        } catch (error) {
            console.error('Monthly report job failed:', error);
        }
    }

    archiveReport(filePath, year, month) {
        const archiveDir = path.join(__dirname, '../reports/archive');
        if (!fs.existsSync(archiveDir)) {
            fs.mkdirSync(archiveDir, { recursive: true });
        }
        
        const archivePath = path.join(archiveDir, `HH_Report_${year}_${month}.xlsx`);
        fs.renameSync(filePath, archivePath);
        
        // Clean up old reports (keep only last 12 months)
        this.cleanupOldReports(archiveDir);
    }

    cleanupOldReports(archiveDir) {
        const files = fs.readdirSync(archiveDir);
        const now = new Date();
        const twelveMonthsAgo = new Date(now.setMonth(now.getMonth() - 12));
        
        files.forEach(file => {
            const filePath = path.join(archiveDir, file);
            const stats = fs.statSync(filePath);
            
            if (stats.mtime < twelveMonthsAgo) {
                fs.unlinkSync(filePath);
                console.log(`Archived old report: ${file}`);
            }
        });
    }

    // Manual trigger for testing
    async generateReportManually(year, month) {
        console.log(`Manually generating report for ${month}/${year}`);
        await this.execute();
    }
}

module.exports = MonthlyReportJob;