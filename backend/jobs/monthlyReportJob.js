// backend/jobs/monthlyReportJob.js
const cron = require('node-cron');
const mongoose = require('mongoose');
const Guest = require('../models/guestModel');
const ExcelReportGenerator = require('../utils/excelGenerator');
const fs = require('fs');
const path = require('path');
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

class MonthlyReportJob {
    constructor() {
        this.excelGenerator = new ExcelReportGenerator();
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

    async sendMonthlyReportEmail(filePath, fileName, year, month, guestCount) {
        try {
            // Read file as base64 for Resend attachment
            const fileBuffer = fs.readFileSync(filePath);
            const fileBase64 = fileBuffer.toString('base64');

            // Get month name
            const monthNames = [
                'January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'
            ];
            const monthName = monthNames[month - 1];

            const recipientEmail = process.env.REPORT_RECIPIENT_EMAIL;
            
            if (!recipientEmail) {
                console.error('REPORT_RECIPIENT_EMAIL not configured');
                return { success: false, error: 'Recipient email not configured' };
            }

            const { data, error } = await resend.emails.send({
                from: process.env.RESEND_FROM_EMAIL || 'Headington Hall <reports@headingtonhall.com>',
                to: recipientEmail,
                subject: `Headington Hall Guest Report - ${monthName} ${year}`,
                html: `
                    <h2>Monthly Guest Report</h2>
                    <p>Please find attached the guest report for <strong>${monthName} ${year}</strong>.</p>
                    <p>This report includes all guest check-ins during this period.</p>
                    <br>
                    <p>Summary:</p>
                    <ul>
                        <li>Total Guests: ${guestCount}</li>
                        <li>Period: ${monthName} 1 - ${new Date(year, month, 0).getDate()}, ${year}</li>
                    </ul>
                    <br>
                    <p style="color: #666; font-size: 12px;">
                        This is an automated monthly report from the Headington Hall Guest Management System.
                    </p>
                `,
                attachments: [
                    {
                        filename: fileName,
                        content: fileBase64,
                    }
                ]
            });

            if (error) {
                console.error('Resend email error:', error);
                return { success: false, error: error.message };
            }

            return { success: true, messageId: data.id };

        } catch (error) {
            console.error('Email sending failed:', error);
            return { success: false, error: error.message };
        }
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
            
            // Send email with Resend
            const emailResult = await this.sendMonthlyReportEmail(
                filePath,
                fileName,
                year,
                month,
                guestsWithHostInfo.length
            );
            
            if (emailResult.success) {
                console.log(`Monthly report for ${month}/${year} completed and emailed`);
                console.log(`Message ID: ${emailResult.messageId}`);
                
                // Archive the report (keep last 12 months)
                this.archiveReport(filePath, year, month);
            } else {
                console.error('Failed to email report:', emailResult.error);
                // Still archive the report even if email fails
                this.archiveReport(filePath, year, month);
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
        
        // Override the current date logic for manual generation
        const firstDay = new Date(year, month - 1, 1);
        const lastDay = new Date(year, month, 0, 23, 59, 59, 999);
        
        const guests = await Guest.find({
            checkIn: { $gte: firstDay, $lte: lastDay }
        }).populate({
            path: 'host',
            select: 'name roomNumber',
            model: 'Resident'
        });
        
        const guestsWithHostInfo = guests.map(guest => {
            const guestObj = guest.toObject();
            if (guest.host) {
                guestObj.hostName = guest.host.name;
                guestObj.hostRoom = guest.host.roomNumber;
            }
            return guestObj;
        });
        
        if (guestsWithHostInfo.length === 0) {
            console.log('No guests found for this period');
            return { success: false, error: 'No guests found' };
        }
        
        const { filePath, fileName } = await this.excelGenerator.generateMonthlyReport(
            guestsWithHostInfo,
            year,
            month
        );
        
        const emailResult = await this.sendMonthlyReportEmail(
            filePath,
            fileName,
            year,
            month,
            guestsWithHostInfo.length
        );
        
        this.archiveReport(filePath, year, month);
        
        return emailResult;
    }
}

module.exports = MonthlyReportJob;