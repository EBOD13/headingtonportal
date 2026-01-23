// backend/utils/excelGenerator.js
const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

class ExcelReportGenerator {
    constructor() {
        this.workbook = new ExcelJS.Workbook();
    }

    // Generate monthly report
    async generateMonthlyReport(guests, year, month) {
        const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        
        const monthName = monthNames[month - 1];
        const fileName = `HH_VisitorLog_${year}_${monthName}.xlsx`;
        
        // Create worksheets
        const northSheet = this.workbook.addWorksheet('North Wing');
        const southSheet = this.workbook.addWorksheet('South Wing');
        const summarySheet = this.workbook.addWorksheet('Summary');
        
        // Set up headers
        this.setupGuestHeaders(northSheet);
        this.setupGuestHeaders(southSheet);
        this.setupSummaryHeaders(summarySheet);
        
        // Separate guests by wing
        const northGuests = guests.filter(g => g.wing === 'North');
        const southGuests = guests.filter(g => g.wing === 'South');
        
        // Add data
        this.addGuestData(northSheet, northGuests);
        this.addGuestData(southSheet, southGuests);
        this.addSummaryData(summarySheet, northGuests, southGuests, monthName, year);
        
        // Style the sheets
        this.styleSheet(northSheet);
        this.styleSheet(southSheet);
        this.styleSummarySheet(summarySheet);
        
        // Create reports directory if it doesn't exist
        const reportsDir = path.join(__dirname, '../reports');
        if (!fs.existsSync(reportsDir)) {
            fs.mkdirSync(reportsDir, { recursive: true });
        }
        
        // Save file
        const filePath = path.join(reportsDir, fileName);
        await this.workbook.xlsx.writeFile(filePath);
        
        console.log(`✅ Report generated: ${filePath}`);
        return { filePath, fileName };
    }

    setupGuestHeaders(sheet) {
        sheet.columns = [
            { header: 'Date', key: 'date', width: 12 },
            { header: 'Guest Name', key: 'guestName', width: 25 },
            { header: 'Host Name', key: 'hostName', width: 25 },
            { header: 'Host Room', key: 'hostRoom', width: 12 },
            { header: 'Contact', key: 'contact', width: 15 },
            { header: 'Student at OU', key: 'studentAtOU', width: 12 },
            { header: 'ID Number', key: 'IDNumber', width: 15 },
            { header: 'Check-in Time', key: 'checkIn', width: 18 },
            { header: 'Check-out Time', key: 'checkout', width: 18 },
            { header: 'Room Visited', key: 'room', width: 15 },
            { header: 'Duration (hours)', key: 'duration', width: 15 }
        ];
        
        // Style header row
        const headerRow = sheet.getRow(1);
        headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        headerRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF841620' } // Headington Hall red
        };
        headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    }

    setupSummaryHeaders(sheet) {
        sheet.columns = [
            { header: 'Metric', key: 'metric', width: 30 },
            { header: 'North Wing', key: 'north', width: 15 },
            { header: 'South Wing', key: 'south', width: 15 },
            { header: 'Total', key: 'total', width: 15 }
        ];
        
        // Style header
        const headerRow = sheet.getRow(1);
        headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        headerRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF2E5C8A' } // Blue
        };
        headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    }

    addGuestData(sheet, guests) {
        guests.forEach((guest, index) => {
            const row = sheet.addRow({
                date: this.formatDate(guest.checkIn),
                guestName: guest.name,
                hostName: guest.hostName || 'N/A',
                hostRoom: guest.hostRoom || 'N/A',
                contact: guest.contact,
                studentAtOU: guest.studentAtOU ? 'Yes' : 'No',
                IDNumber: guest.IDNumber,
                checkIn: this.formatTime(guest.checkIn),
                checkout: guest.checkout ? this.formatTime(guest.checkout) : 'Not checked out',
                room: guest.room,
                duration: this.calculateDuration(guest.checkIn, guest.checkout)
            });
            
            // Alternate row colors for readability
            if (index % 2 === 0) {
                row.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFF5F5F5' }
                };
            }
        });
    }

    addSummaryData(sheet, northGuests, southGuests, monthName, year) {
        const totalNorth = northGuests.length;
        const totalSouth = southGuests.length;
        const totalGuests = totalNorth + totalSouth;
        
        const checkedInNorth = northGuests.filter(g => g.isCheckedIn).length;
        const checkedInSouth = southGuests.filter(g => g.isCheckedIn).length;
        const totalCheckedIn = checkedInNorth + checkedInSouth;
        
        const studentsNorth = northGuests.filter(g => g.studentAtOU).length;
        const studentsSouth = southGuests.filter(g => g.studentAtOU).length;
        const totalStudents = studentsNorth + studentsSouth;
        
        sheet.addRow(['', '', '', '']); // Empty row
        
        sheet.addRow(['Total Guests', totalNorth, totalSouth, totalGuests]);
        sheet.addRow(['Currently Checked-in', checkedInNorth, checkedInSouth, totalCheckedIn]);
        sheet.addRow(['OU Students', studentsNorth, studentsSouth, totalStudents]);
        sheet.addRow(['Non-OU Visitors', totalNorth - studentsNorth, totalSouth - studentsSouth, totalGuests - totalStudents]);
        
        // Add title
        sheet.spliceRows(1, 0, []);
        sheet.mergeCells('A1:D1');
        const titleRow = sheet.getRow(1);
        titleRow.getCell(1).value = `Headington Hall Visitor Report - ${monthName} ${year}`;
        titleRow.getCell(1).font = { bold: true, size: 16, color: { argb: 'FF841620' } };
        titleRow.getCell(1).alignment = { horizontal: 'center' };
        titleRow.height = 30;
    }

    styleSheet(sheet) {
        // Auto-fit columns
        sheet.columns.forEach(column => {
            column.width = Math.max(column.width || 10, 10);
        });
        
        // Add borders to all cells
        sheet.eachRow((row, rowNumber) => {
            row.eachCell((cell) => {
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
            });
        });
    }

    styleSummarySheet(sheet) {
        this.styleSheet(sheet);
        
        // Style summary rows
        for (let i = 3; i <= 7; i++) {
            const row = sheet.getRow(i);
            row.font = { bold: true };
            
            if (i === 3) { // Total Guests row
                row.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFE8F5E8' } // Light green
                };
            }
        }
    }

    formatDate(date) {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    formatTime(date) {
        if (!date) return 'N/A';
        return new Date(date).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    }

    calculateDuration(checkIn, checkout) {
        if (!checkIn || !checkout) return 'N/A';
        
        const diffMs = new Date(checkout) - new Date(checkIn);
        const diffHours = diffMs / (1000 * 60 * 60);
        
        return diffHours.toFixed(1) + ' hours';
    }
}

module.exports = ExcelReportGenerator;