// backend/utils/emailService.js - UPDATED
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

class EmailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            service: "Gmail",
            host: "smtp.gmail.com",
            port: 465,
            secure: true,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD
            },
            tls: {
                rejectUnauthorized: false
            }
        });
        
        // Validate email configuration
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
            console.warn('⚠️  Email credentials not configured. Email features will not work.');
            console.warn('   Add EMAIL_USER and EMAIL_PASSWORD to your .env file');
        }
    }

    async sendMonthlyReport(reportPath, fileName, year, month, recipients = null) {
        const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        
        const monthName = monthNames[month - 1];
        
        // Determine recipients
        let toAddresses = [];
        let ccAddresses = [];
        
        if (recipients) {
            // Use provided recipients
            if (Array.isArray(recipients)) {
                toAddresses = recipients;
            } else {
                toAddresses = [recipients];
            }
        } else {
            // Use environment variables
            const adminEmail = process.env.ADMIN_EMAIL;
            if (!adminEmail) {
                throw new Error('ADMIN_EMAIL not configured in environment variables');
            }
            toAddresses = [adminEmail];
            
            // Add CC if configured
            if (process.env.REPORT_CC) {
                ccAddresses = process.env.REPORT_CC.split(',').map(email => email.trim());
            }
        }
        
        // Validate email addresses
        const validateEmail = (email) => {
            const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return re.test(email);
        };
        
        const validTo = toAddresses.filter(email => validateEmail(email));
        const validCc = ccAddresses.filter(email => validateEmail(email));
        
        if (validTo.length === 0) {
            throw new Error('No valid email addresses to send report to');
        }
        
        console.log(`📧 Sending report to: ${validTo.join(', ')}`);
        if (validCc.length > 0) {
            console.log(`   CC: ${validCc.join(', ')}`);
        }
        
        const mailOptions = {
            from: `"Headington Hall Portal" <${process.env.EMAIL_USER}>`,
            to: validTo.join(', '),
            subject: `Headington Hall Visitor Report - ${monthName} ${year}`,
            html: this.getReportEmailTemplate(monthName, year, validTo),
            attachments: [
                {
                    filename: fileName,
                    path: reportPath,
                    contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                }
            ]
        };
        
        // Add CC if present
        if (validCc.length > 0) {
            mailOptions.cc = validCc.join(', ');
        }

        try {
            const info = await this.transporter.sendMail(mailOptions);
            console.log(`✅ Monthly report emailed: ${info.messageId}`);
            
            // Log email details (without full content for privacy)
            console.log(`   Sent to: ${validTo.length} recipient(s)`);
            if (validCc.length > 0) {
                console.log(`   CC'd: ${validCc.length} recipient(s)`);
            }
            
            return { 
                success: true, 
                messageId: info.messageId,
                recipients: {
                    to: validTo,
                    cc: validCc
                }
            };
        } catch (error) {
            console.error('❌ Email failed:', error.message);
            
            // Provide helpful error messages
            let userMessage = error.message;
            if (error.code === 'EAUTH') {
                userMessage = 'Authentication failed. Check your email credentials in .env';
            } else if (error.code === 'EENVELOPE') {
                userMessage = 'Invalid email address format';
            }
            
            return { 
                success: false, 
                error: userMessage,
                originalError: error.message 
            };
        }
    }

    getReportEmailTemplate(monthName, year, recipients) {
        // Extract domain from first recipient for personalization
        const firstRecipient = recipients[0] || '';
        const domain = firstRecipient.split('@')[1] || 'university.edu';
        const isUniversityEmail = domain.includes('.edu');
        
        const greeting = isUniversityEmail 
            ? 'Dear Headington Hall Administrator'
            : 'Dear Administrator';
        
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 700px;
                    margin: 0 auto;
                    padding: 20px;
                    background-color: #f5f5f5;
                }
                .email-container {
                    background-color: white;
                    border-radius: 10px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    overflow: hidden;
                }
                .header {
                    background: linear-gradient(135deg, #841620 0%, #a02030 100%);
                    color: white;
                    padding: 30px 20px;
                    text-align: center;
                }
                .header h1 {
                    margin: 0;
                    font-size: 24px;
                    font-weight: 600;
                }
                .header .subtitle {
                    margin: 10px 0 0;
                    opacity: 0.9;
                    font-size: 16px;
                }
                .content {
                    padding: 30px;
                }
                .greeting {
                    font-size: 16px;
                    margin-bottom: 25px;
                    color: #555;
                }
                .report-info {
                    background-color: #f8f9fa;
                    border-left: 4px solid #841620;
                    padding: 20px;
                    margin: 25px 0;
                    border-radius: 0 8px 8px 0;
                }
                .report-info h3 {
                    color: #841620;
                    margin-top: 0;
                }
                .attachment-box {
                    background-color: #e8f4f8;
                    border: 1px dashed #5dade2;
                    border-radius: 8px;
                    padding: 20px;
                    margin: 25px 0;
                    text-align: center;
                }
                .attachment-icon {
                    font-size: 32px;
                    margin-bottom: 10px;
                    display: block;
                }
                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 15px;
                    margin: 25px 0;
                }
                .stat-card {
                    background-color: #f8f9fa;
                    padding: 15px;
                    border-radius: 8px;
                    text-align: center;
                    border: 1px solid #e9ecef;
                }
                .stat-card .number {
                    font-size: 24px;
                    font-weight: bold;
                    color: #841620;
                    display: block;
                }
                .footer {
                    margin-top: 40px;
                    padding-top: 20px;
                    border-top: 1px solid #eee;
                    font-size: 14px;
                    color: #666;
                    text-align: center;
                }
                .footer-logo {
                    color: #841620;
                    font-weight: bold;
                    font-size: 16px;
                    margin-bottom: 10px;
                }
                .auto-notice {
                    font-size: 12px;
                    color: #888;
                    margin-top: 15px;
                    font-style: italic;
                }
                .button {
                    display: inline-block;
                    background-color: #841620;
                    color: white;
                    padding: 12px 25px;
                    text-decoration: none;
                    border-radius: 5px;
                    font-weight: 600;
                    margin-top: 15px;
                }
                .button:hover {
                    background-color: #a02030;
                }
                @media (max-width: 600px) {
                    .content {
                        padding: 20px;
                    }
                    .stats-grid {
                        grid-template-columns: 1fr;
                    }
                }
            </style>
        </head>
        <body>
            <div class="email-container">
                <div class="header">
                    <h1>Headington Hall Visitor Portal</h1>
                    <div class="subtitle">Monthly Activity Report</div>
                </div>
                
                <div class="content">
                    <div class="greeting">
                        ${greeting},
                    </div>
                    
                    <p>Please find attached the monthly visitor activity report for <strong>${monthName} ${year}</strong>.</p>
                    
                    <div class="report-info">
                        <h3>📋 Report Overview</h3>
                        <p>This report contains detailed visitor logs for both North and South wings, including:</p>
                        <ul>
                            <li>Guest check-in/check-out times</li>
                            <li>Host information and room assignments</li>
                            <li>Visitor duration statistics</li>
                            <li>Monthly summary and key metrics</li>
                        </ul>
                    </div>
                    
                    <div class="attachment-box">
                        <div class="attachment-icon">📎</div>
                        <h3>Attached File</h3>
                        <p><strong>Filename:</strong> HH_VisitorLog_${year}_${monthName}.xlsx</p>
                        <p><strong>File Type:</strong> Microsoft Excel (.xlsx)</p>
                        <p><strong>Generated:</strong> ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
                    </div>
                    
                    <div style="text-align: center;">
                        <p>For security reasons, this report is password protected. Use your standard university credentials to open.</p>
                    </div>
                    
                    <div class="footer">
                        <div class="footer-logo">HEADINGTON HALL</div>
                        <p>University of Oklahoma Athletics Department<br>
                        180 W. Brooks Street, Norman, OK 73019</p>
                        
                        <div class="auto-notice">
                            This is an automated message generated by the Headington Hall Visitor Portal System.<br>
                            Please do not reply to this email. For assistance, contact the IT department.
                        </div>
                    </div>
                </div>
            </div>
        </body>
        </html>
        `;
    }

    // Test email configuration
    async testEmailConfig() {
        console.log('🧪 Testing email configuration...');
        
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
            return {
                success: false,
                error: 'Email credentials not configured in .env file',
                required: ['EMAIL_USER', 'EMAIL_PASSWORD', 'ADMIN_EMAIL']
            };
        }
        
        try {
            // Verify transporter configuration
            await this.transporter.verify();
            console.log('✅ Email server connection successful');
            
            // Send test email
            console.log('📤 Sending test email...');
            
            const testMailOptions = {
                from: `"Headington Hall Test" <${process.env.EMAIL_USER}>`,
                to: process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
                subject: 'Headington Hall - Email Configuration Test',
                html: `
                <div style="font-family: Arial, sans-serif; padding: 20px;">
                    <h2 style="color: #841620;">✅ Email Configuration Test Successful</h2>
                    <p>This is a test email from your Headington Hall Visitor Portal.</p>
                    <p>If you received this email, your email configuration is working correctly.</p>
                    <p><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
                    <p><strong>System:</strong> Monthly Report Generator</p>
                    <hr>
                    <p style="color: #666; font-size: 12px;">
                        This is an automated test message. No action is required.
                    </p>
                </div>
                `
            };
            
            const info = await this.transporter.sendMail(testMailOptions);
            
            return {
                success: true,
                message: 'Test email sent successfully',
                messageId: info.messageId,
                recipient: testMailOptions.to
            };
            
        } catch (error) {
            console.error('❌ Email test failed:', error.message);
            
            return {
                success: false,
                error: error.message,
                code: error.code,
                suggestion: error.code === 'EAUTH' 
                    ? 'Use an App Password instead of your regular Gmail password'
                    : 'Check your internet connection and email settings'
            };
        }
    }

    // Optional: Send custom email
    async sendCustomEmail(to, subject, html, attachments = []) {
        try {
            const mailOptions = {
                from: `"Headington Hall Portal" <${process.env.EMAIL_USER}>`,
                to: Array.isArray(to) ? to.join(', ') : to,
                subject: subject,
                html: html,
                attachments: attachments
            };
            
            const info = await this.transporter.sendMail(mailOptions);
            return { success: true, messageId: info.messageId };
            
        } catch (error) {
            console.error('Custom email failed:', error);
            return { success: false, error: error.message };
        }
    }
}

module.exports = EmailService;