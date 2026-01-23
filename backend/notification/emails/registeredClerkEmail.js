const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "Gmail",
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth:{
        user: "ebodtechs@gmail.com",
        pass: "uhpl igsb fdzs agsw"
    },
    tls: {
        rejectUnauthorized: false // Add this line to bypass certificate validation
    }
});
function sendEmail(name, email, clerkID) {
const mailOptions = {
    from: '"Headington Portal"<ebodtechs@gmail.com>',
    to: email,
    subject: "Hello",
    html: 
    `
    <html>
<head>
    <style>
        .banner {
            background-color: #841620; /* Blue banner */
            color: #ffffff;
            padding: 10px;
            text-align: center;
            border-radius: 5px;
        }
        .boxed-content {
            background-color: #fdf7f2;
            padding: 20px;
            line-height: 1.5; /* Increase line height for better readability */
        }
        .boxed-content p {
            margin-bottom: 10px; /* Add margin bottom to separate paragraphs */
        }
    </style>
</head>
<body>
    <div class="banner">
        <h1>Welcome to Headington Hall</h1>
    </div>
    <div class="boxed-content">
        <p>Hello ${name},</p>

        <p>Welcome to Headington Hall and congratulations on joining The University of Oklahoma Athletics Department team as a front desk clerk!</p>

        <p>At Headington Hall, we pride ourselves on maintaining a supportive and orderly residence environment, and your role as a front desk clerk is integral to upholding these standards.</p>

        <p>To facilitate your responsibilities effectively, we have provided you with your new credentials.</p>

        <p>Your ClerkID is: <strong>${clerkID}</strong>.</p>

        <p>This credential will serve as your access key to the Headington Portal, where you'll manage various aspects of your duties.</p>

        <p>For security purposes, please note that your password has been auto-generated and will be provided to you separately. We recommend changing your password immediately after logging in for the first time. Additionally, please be aware that the provided passkey for your credential will be valid for 24 hours only.</p>

        <p>We're thrilled to have you as part of our team and look forward to your contributions to the Headington Hall community.</p>

        <p>Warm regards,</p>
        <p>[Your Name]</p>
        <p>[Your Position]</p>
        <p>The University of Oklahoma Athletics Department</p>
    </div>
</body>
</html>
    `
};

transporter.sendMail(mailOptions, function(error, info){
    if(error){
        console.log(error);
    }
    else{
        console.log("Email sent successfully")
    }
});
}
// +18889075180
module.exports = sendEmail;