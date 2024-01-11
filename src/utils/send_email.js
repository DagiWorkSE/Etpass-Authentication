// const { EmailClient } = require("@azure/communication-email");
// const dotenv = require("dotenv");

// dotenv.config();

// async function sendVerificationEmail(email, token) {
//     try {
//         const connectionString = process.env.AZURE_COMMUNICATION_EMAIL_CONNECTION_STRING;

//         if (!connectionString) {
//             throw new Error("Azure Communication Email connection string is missing.");
//         }

//         const emailClient = new EmailClient(connectionString);

//         const sendEmailRequest = {
//             from: { emailAddress: "verify@466ba01d-75b6-4a10-9941-2c78d6508911.azurecomm.net" },
//             to: { emailAddress: email },
//             subject: "Email Verification",
//             htmlBody: `<p>Click the following link to verify your email: http://your-verification-url/${token}</p>`,
//         };

//         // const response = await emailClient.sendEmail(sendEmailRequest); // Check the correct method name
        
//     const poller = await emailClient.beginSend(sendEmailRequest);
//     const result = await poller.pollUntilDone();

//         console.log('Email sent:', response);
//     } catch (error) {
//         console.error('Error sending email:', error.message);
//     }
// }

// module.exports = { sendVerificationEmail };









const { EmailClient } = require("@azure/communication-email");

// This code retrieves your connection string from an environment variable.
const connectionString = "endpoint=https://comm-service-dev.unitedstates.communication.azure.com/;accesskey=EM+evsvWc0wiDlv+iu2bZGGoTS6oLobIA9Lr9v1HHxrp5pp+/Tpg2b8O9QlpyJTlUBj9IQX2MZPlgYipI82Btg==";
const emailClient = new EmailClient(connectionString);
const localhostPort = 8000;
async function sendVerificationEmail(email, token) {
    const emailMessage = {
        senderAddress: "verify@466ba01d-75b6-4a10-9941-2c78d6508911.azurecomm.net",
        content: {
            subject: "verification message",
            plainText: `Click the following link to verify your email: http://localhost:${localhostPort}/auth/auth/verify-email/${token}`,
        },
        recipients: {
            to: [{ address: email }],
        },
    };

    const poller = await emailClient.beginSend(emailMessage);
    const result = await poller.pollUntilDone();
}
module.exports = { sendVerificationEmail };


// const nodemailer = require("nodemailer");

// // Replace these values with your Google account credentials
// const gmailUser = "natichoaye@gmail.com";
// const gmailPassword = "xmtw vlaq nkdy lywg";

// // Replace yourPortNumber with the port number your localhost server is running on
// const localhostPort = 8000;

// async function sendVerificationEmail(email, token) {
//     // Create a nodemailer transporter using your Google account
//     const transporter = nodemailer.createTransport({
//         service: "gmail",
//         auth: {
//             user: gmailUser,
//             pass: gmailPassword,
//         },
//     });

//     // Change the verification link endpoint to localhost
//     const verificationLink = `http://localhost:${localhostPort}/auth/auth/verify-email/${token}`;

//     // Email message options
//     const mailOptions = {
//         from: "yonasgetyonas@gmail.com",
//         to: email,
//         subject: "Verification message",
//         text: `Click the following link to verify your email: ${verificationLink}`,
//     };

//     // Send the email
//     const info = await transporter.sendMail(mailOptions);

//     console.log("Email sent: " + info.response);
// }

// module.exports = { sendVerificationEmail };
