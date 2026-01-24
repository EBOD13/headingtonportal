// backend/notification/emails/registeredClerkEmail.js
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "Gmail",
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
    tls: {
        rejectUnauthorized: false
    }
});

/**
 * Send "new clerk" email with ClerkID + temp password.
 * Optionally include a "set password" link.
 */
function sendRegisteredClerkEmail({ name, email, clerkID, tempPassword, setPasswordUrl }) {
    const mailOptions = {
        from: `"Headington Portal" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Your Headington Portal Clerk Credentials",
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <style>
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background-color: #f9fafb;
      margin: 0;
      padding: 0;
    }
    .wrapper {
      max-width: 600px;
      margin: 0 auto;
      padding: 24px 16px;
    }
    .banner {
      background-color: #841620;
      color: #ffffff;
      padding: 16px 20px;
      text-align: center;
      border-radius: 12px 12px 0 0;
    }
    .banner h1 {
      margin: 0;
      font-size: 20px;
      letter-spacing: 0.03em;
    }
    .content {
      background-color: #ffffff;
      padding: 20px;
      border-radius: 0 0 12px 12px;
      border: 1px solid #e5e7eb;
      border-top: none;
      line-height: 1.6;
      color: #111827;
    }
    .credentials {
      background-color: #f9fafb;
      border-radius: 8px;
      padding: 12px 14px;
      border: 1px dashed #d1d5db;
      margin: 16px 0;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
      font-size: 14px;
    }
    .credentials div {
      margin-bottom: 4px;
    }
    .cta-button {
      display: inline-block;
      margin: 12px 0 16px;
      padding: 10px 18px;
      background-color: #841620;
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 999px;
      font-weight: 600;
      font-size: 14px;
    }
    .note {
      font-size: 13px;
      color: #4b5563;
      margin-top: 8px;
    }
    .footer {
      margin-top: 16px;
      font-size: 12px;
      color: #6b7280;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="banner">
      <h1>Headington Hall Front Desk</h1>
    </div>
    <div class="content">
      <p>Hi ${name || 'there'},</p>

      <p>Welcome to Headington Hall, and congratulations on joining the OU Athletics Department team as a front desk clerk.</p>

      <p>We've created your account for the Headington Portal. Here are your temporary credentials:</p>

      <div class="credentials">
        <div><strong>Clerk ID:</strong> ${clerkID}</div>
        <div><strong>Temporary password:</strong> ${tempPassword}</div>
      </div>

      <p>
        For security, this temporary password is intended for first-time login only. 
        You must change your password within <strong>3 days</strong> of receiving this email. 
        After that, your account may be automatically paused until a new password is set.
      </p>

      ${
        setPasswordUrl
          ? `<p>You can change your password now using this secure link:</p>
             <p><a class="cta-button" href="${setPasswordUrl}" target="_blank" rel="noopener noreferrer">
               Set your password
             </a></p>`
          : ''
      }

      <p class="note">
        Please keep these credentials confidential and do not share them with anyone. 
        If you believe this email reached you in error, contact the Assistant Director immediately.
      </p>

      <p>Warm regards,<br/>
      Headington Hall Staff<br/>
      The University of Oklahoma Athletics Department</p>
    </div>

    <div class="footer">
      This email was sent automatically by the Headington Portal system. Please do not reply directly.
    </div>
  </div>
</body>
</html>
        `,
    };

    // ✅ Return a Promise so we can await it
    return new Promise((resolve, reject) => {
        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.error("Error sending registered clerk email:", error.message);
                reject(error);
            } else {
                console.log("Registered clerk email sent:", info.response);
                resolve(info);
            }
        });
    });
}

module.exports = sendRegisteredClerkEmail;
