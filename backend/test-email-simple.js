// backend/test-email-simple.js
require('dotenv').config();
const nodemailer = require('nodemailer');

console.log('📧 Simple Email Configuration Test\n');

// Check environment variables
console.log('1. Checking Environment Variables:');
console.log('   EMAIL_USER:', process.env.EMAIL_USER || '❌ Not set');
console.log('   EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? '✅ Set (hidden)' : '❌ Not set');
console.log('   ADMIN_EMAIL:', process.env.ADMIN_EMAIL || '❌ Not set');

if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
  console.log('\n❌ Email credentials missing.');
  console.log('   Add to .env file:');
  console.log('   EMAIL_USER=your-email@gmail.com');
  console.log('   EMAIL_PASSWORD=your-app-password');
  console.log('   ADMIN_EMAIL=recipient@email.com');
  process.exit(1);
}

// Create transporter
const transporter = nodemailer.createTransport({
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

async function testEmail() {
  console.log('\n2. Testing SMTP Connection...');
  
  try {
    // Verify connection configuration
    await transporter.verify();
    console.log('   ✅ SMTP connection successful');
    
    // Send test email
    console.log('\n3. Sending Test Email...');
    
    const mailOptions = {
      from: `"Headington Hall Test" <${process.env.EMAIL_USER}>`,
      to: process.env.ADMIN_EMAIL,
      subject: 'Headington Hall - Email Test',
      text: 'This is a test email from Headington Hall Visitor Portal.',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="color: #841620;">✅ Email Test Successful</h2>
          <p>This is a test email from your Headington Hall Visitor Portal.</p>
          <p>If you received this, your email configuration is working correctly!</p>
          <p><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
          <hr>
          <p style="color: #666; font-size: 12px;">
            Automated test message - No action required.
          </p>
        </div>
      `
    };
    
    const info = await transporter.sendMail(mailOptions);
    
    console.log('   ✅ Test email sent successfully!');
    console.log('   📫 Message ID:', info.messageId);
    console.log('   👤 Recipient:', process.env.ADMIN_EMAIL);
    console.log('\n🎉 Email configuration is working!');
    
  } catch (error) {
    console.error('\n❌ Email test failed:', error.message);
    
    // Provide helpful error messages
    if (error.code === 'EAUTH') {
      console.log('\n🔧 AUTHENTICATION ERROR:');
      console.log('   Your Gmail credentials are incorrect.');
      console.log('   For Gmail, you need to:');
      console.log('   1. Enable 2-Factor Authentication');
      console.log('   2. Generate an "App Password":');
      console.log('      https://myaccount.google.com/apppasswords');
      console.log('   3. Use the 16-character app password (not your regular password)');
    } else if (error.code === 'EENVELOPE') {
      console.log('\n🔧 ADDRESS ERROR:');
      console.log('   Invalid email address format.');
      console.log('   Check ADMIN_EMAIL in your .env file.');
    } else {
      console.log('\n🔧 GENERAL ERROR:');
      console.log('   Error code:', error.code);
      console.log('   Full error:', error);
    }
    
    process.exit(1);
  }
}

testEmail();