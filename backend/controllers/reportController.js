// backend/controllers/reportController.js
const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const Guest = require('../models/guestModel');
const ExcelReportGenerator = require('../utils/excelGenerator');
const fs = require('fs');
const path = require('path');
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const generateMonthlyReport = asyncHandler(async (req, res) => {
    try {
        const { year, month } = req.body;
        
        if (!year || !month) {
            return res.status(400).json({ 
                error: 'Year and month are required' 
            });
        }

        // Validate month
        const monthNum = parseInt(month);
        if (monthNum < 1 || monthNum > 12) {
            return res.status(400).json({ 
                error: 'Month must be between 1 and 12' 
            });
        }

        // Calculate date range
        const firstDay = new Date(year, monthNum - 1, 1);
        const lastDay = new Date(year, monthNum, 0, 23, 59, 59, 999);

        // Fetch guests
        const guests = await Guest.find({
            checkIn: { $gte: firstDay, $lte: lastDay }
        }).populate({
            path: 'host',
            select: 'name roomNumber',
            model: 'Resident'
        });

        // Add host info
        const guestsWithHostInfo = guests.map(guest => ({
            ...guest.toObject(),
            hostName: guest.host?.name || 'N/A',
            hostRoom: guest.host?.roomNumber || 'N/A'
        }));

        // Generate Excel
        const excelGenerator = new ExcelReportGenerator();
        const { filePath, fileName } = await excelGenerator.generateMonthlyReport(
            guestsWithHostInfo,
            year,
            monthNum
        );

        // Read file for download
        const fileBuffer = fs.readFileSync(filePath);

        // Clean up temp file after sending
        res.on('finish', () => {
            fs.unlinkSync(filePath);
        });

        // Send file
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.send(fileBuffer);

    } catch (error) {
        console.error('Report generation error:', error);
        res.status(500).json({ 
            error: 'Failed to generate report',
            details: error.message 
        });
    }
});

const sendReportByEmail = asyncHandler(async (req, res) => {
    try {
        const { year, month, email } = req.body;
        
        if (!year || !month) {
            return res.status(400).json({ 
                error: 'Year and month are required' 
            });
        }

        // Similar logic to generate report first
        const monthNum = parseInt(month);
        const firstDay = new Date(year, monthNum - 1, 1);
        const lastDay = new Date(year, monthNum, 0, 23, 59, 59, 999);

        const guests = await Guest.find({
            checkIn: { $gte: firstDay, $lte: lastDay }
        }).populate('host');

        const guestsWithHostInfo = guests.map(guest => ({
            ...guest.toObject(),
            hostName: guest.host?.name || 'N/A',
            hostRoom: guest.host?.roomNumber || 'N/A'
        }));

        // Generate Excel
        const excelGenerator = new ExcelReportGenerator();
        const { filePath, fileName } = await excelGenerator.generateMonthlyReport(
            guestsWithHostInfo,
            year,
            monthNum
        );

        // Read file as base64 for Resend attachment
        const fileBuffer = fs.readFileSync(filePath);
        const fileBase64 = fileBuffer.toString('base64');

        // Get month name for email
        const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        const monthName = monthNames[monthNum - 1];

        // Send email with Resend
        const recipientEmail = email || process.env.REPORT_RECIPIENT_EMAIL;
        
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
                    <li>Total Guests: ${guestsWithHostInfo.length}</li>
                    <li>Period: ${monthName} 1 - ${new Date(year, monthNum, 0).getDate()}, ${year}</li>
                </ul>
                <br>
                <p style="color: #666; font-size: 12px;">
                    This is an automated report from the Headington Hall Guest Management System.
                </p>
            `,
            attachments: [
                {
                    filename: fileName,
                    content: fileBase64,
                }
            ]
        });

        // Clean up temp file
        fs.unlinkSync(filePath);

        if (error) {
            console.error('Resend email error:', error);
            return res.status(500).json({
                error: 'Failed to send email',
                details: error.message
            });
        }

        res.json({
            success: true,
            message: `Report for ${month}/${year} sent successfully`,
            messageId: data.id
        });

    } catch (error) {
        console.error('Email report error:', error);
        res.status(500).json({ 
            error: 'Failed to send report',
            details: error.message 
        });
    }
});

const getReportStats = asyncHandler(async (req, res) => {
    try {
        const { year, month } = req.query;
        
        let matchStage = {};
        if (year && month) {
            const monthNum = parseInt(month);
            const firstDay = new Date(year, monthNum - 1, 1);
            const lastDay = new Date(year, monthNum, 0, 23, 59, 59, 999);
            matchStage.checkIn = { $gte: firstDay, $lte: lastDay };
        } else if (year) {
            const firstDay = new Date(year, 0, 1);
            const lastDay = new Date(year, 11, 31, 23, 59, 59, 999);
            matchStage.checkIn = { $gte: firstDay, $lte: lastDay };
        }

        const stats = await Guest.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: '$wing',
                    totalGuests: { $sum: 1 },
                    checkedIn: { 
                        $sum: { $cond: [{ $eq: ['$isCheckedIn', true] }, 1, 0] } 
                    },
                    ouStudents: { 
                        $sum: { $cond: [{ $eq: ['$studentAtOU', true] }, 1, 0] } 
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    wings: { $push: { wing: '$_id', stats: '$$ROOT' } },
                    total: { $sum: '$totalGuests' },
                    totalCheckedIn: { $sum: '$checkedIn' },
                    totalOUStudents: { $sum: '$ouStudents' }
                }
            },
            {
                $project: {
                    _id: 0,
                    wings: 1,
                    total: 1,
                    totalCheckedIn: 1,
                    totalOUStudents: 1,
                    totalNonOU: { $subtract: ['$total', '$totalOUStudents'] }
                }
            }
        ]);

        res.json(stats[0] || {
            wings: [],
            total: 0,
            totalCheckedIn: 0,
            totalOUStudents: 0,
            totalNonOU: 0
        });

    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({ 
            error: 'Failed to get statistics',
            details: error.message 
        });
    }
});

module.exports = {
    generateMonthlyReport,
    sendReportByEmail,
    getReportStats
};