// backend/controllers/reportController.js
const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const Guest = require('../models/guestModel');
const ExcelReportGenerator = require('../utils/excelGenerator');
const EmailService = require('../utils/emailService');
const fs = require('fs');
const path = require('path');

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

        // Send email
        const emailService = new EmailService();
        const emailResult = await emailService.sendMonthlyReport(
            filePath,
            fileName,
            year,
            monthNum
        );

        // Clean up
        fs.unlinkSync(filePath);

        if (emailResult.success) {
            res.json({
                success: true,
                message: `Report for ${month}/${year} sent successfully`,
                messageId: emailResult.messageId
            });
        } else {
            res.status(500).json({
                error: 'Failed to send email',
                details: emailResult.error
            });
        }

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