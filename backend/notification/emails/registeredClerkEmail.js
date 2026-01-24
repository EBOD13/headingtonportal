// backend/notification/emails/registeredClerkEmail.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'Gmail',
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER, // e.g. ebodtechs@gmail.com
    pass: process.env.EMAIL_PASSWORD, 
  },
  tls: {
    rejectUnauthorized: false,
  },
});

/**
 * Send "Welcome / Reset" email to clerk
 *
 * @param {Object} opts
 * @param {string} opts.name
 * @param {string} opts.email
 * @param {string} opts.clerkID
 * @param {string} opts.tempPassword - plain temp password
 * @param {string} opts.resetLink - one-time link to set password
 * @param {number} opts.expiresInDays - e.g. 3
 * @param {boolean} opts.isReset - if true, wording is "reset" instead of "welcome"
 */
async function sendRegisteredClerkEmail({
  name,
  email,
  clerkID,
  tempPassword,
  resetLink,
  expiresInDays = 3,
  isReset = false,
}) {
  const safeName = name || 'Clerk';

  const subject = isReset
    ? 'Password reset for your Headington Portal account'
    : 'Your Headington Portal clerk account';

  const introLine = isReset
    ? `A password reset was requested for your Headington Hall clerk account.`
    : `Welcome to Headington Hall and congratulations on joining the front desk team!`;

  const actionLine = isReset
    ? `Use the temporary password and link below to set a new password.`
    : `Use the temporary password and link below to set up your account.`;

  const html = `
  <html>
    <head>
      <style>
        body {
          font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          background-color: #f3f4f6;
          margin: 0;
          padding: 0;
        }
        .wrapper {
          padding: 24px;
        }
        .card {
          max-width: 640px;
          margin: 0 auto;
          background: #ffffff;
          border-radius: 16px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.08);
          overflow: hidden;
        }
        .banner {
          background: linear-gradient(135deg, #841620, #6b1213);
          color: #ffffff;
          padding: 16px 24px;
          text-align: center;
        }
        .banner h1 {
          margin: 0;
          font-size: 20px;
          letter-spacing: 0.03em;
          text-transform: uppercase;
        }
        .content {
          padding: 24px;
          background: #fdf7f2;
        }
        .content p {
          line-height: 1.6;
          margin: 0 0 10px;
          color: #111827;
        }
        .label {
          font-weight: 600;
        }
        .credential-box {
          background: #111827;
          color: #f9fafb;
          border-radius: 12px;
          padding: 16px;
          margin: 16px 0;
          font-family: "SF Mono", Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
          font-size: 14px;
        }
        .credential-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        .credential-row span.key {
          opacity: 0.8;
        }
        .credential-row span.value {
          font-weight: 600;
        }
        .credential-note {
          font-size: 12px;
          opacity: 0.9;
          margin-top: 8px;
        }
        .cta-btn {
          display: inline-block;
          margin-top: 12px;
          padding: 10px 18px;
          border-radius: 999px;
          background: #841620;
          color: #ffffff !important;
          text-decoration: none;
          font-weight: 600;
          font-size: 14px;
        }
        .cta-btn:hover {
          background: #6b1213;
        }
        .footer {
          padding: 16px 24px 20px;
          background: #f9fafb;
          border-top: 1px solid #e5e7eb;
          font-size: 12px;
          color: #6b7280;
          text-align: center;
        }
        .link {
          color: #841620;
          word-break: break-all;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="card">
          <div class="banner">
            <h1>Headington Hall Portal</h1>
          </div>
          <div class="content">
            <p>Hello ${safeName},</p>
            <p>${introLine}</p>
            <p>${actionLine}</p>

            <div class="credential-box">
              <div class="credential-row">
                <span class="key">Clerk ID</span>
                <span class="value">${clerkID}</span>
              </div>
              <div class="credential-row">
                <span class="key">Temporary password</span>
                <span class="value">${tempPassword}</span>
              </div>
              <p class="credential-note">
                This temporary password is valid until your account is updated.
                For security, you must choose a new password within ${expiresInDays} days.
                After that, your account will automatically be paused until a new reset is issued.
              </p>
            </div>

            <p>
              To set your password, click the button below or paste this link into your browser:
            </p>
            <p>
              <a href="${resetLink}" class="cta-btn" target="_blank" rel="noopener noreferrer">
                Set my password
              </a>
            </p>
            <p class="link">${resetLink}</p>

            <p>If you did not expect this email, please contact your supervisor or the Assistant Director.</p>

            <p>Warm regards,<br/>
               Headington Hall Staff<br/>
               The University of Oklahoma Athletics Department
            </p>
          </div>
          <div class="footer">
            This link is personal to your account and will expire in ${expiresInDays} days.
          </div>
        </div>
      </div>
    </body>
  </html>
  `;

  const text = `
Hello ${safeName},

${introLine}

Your clerk account details:

- Clerk ID: ${clerkID}
- Temporary password: ${tempPassword}

To set your password, open this link (it is unique to you and expires in ${expiresInDays} days):

${resetLink}

For security, you must choose a new password within ${expiresInDays} days. After that, your account will be paused until a new reset is issued.

If you did not expect this email, please contact your supervisor or the Assistant Director.

Headington Hall
The University of Oklahoma Athletics Department
  `.trim();

  const mailOptions = {
    from: '"Headington Portal" <' + process.env.EMAIL_USER + '>',
    to: email,
    subject,
    text,
    html,
  };

  const info = await transporter.sendMail(mailOptions);
  console.log('Registered clerk email sent:', info.messageId);
}

module.exports = sendRegisteredClerkEmail;
