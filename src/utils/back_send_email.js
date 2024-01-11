const { EmailClient, SendEmailRequest } = require("@azure/communication-email");
const dotenv = require("dotenv");
dotenv.config({ path: "../.env" });
async function sendVerificationEmail(email, token) {
    try {
        const connectionString = process.env.AZURE_COMMUNICATION_EMAIL_CONNECTION_STRING;

        if (!connectionString) {
            throw new Error("Azure Communication Email connection string is missing.");
        }

        const emailClient = new EmailClient(connectionString);

        // Construct the email message
        const sendEmailRequest = {
            from: { emailAddress: 'Welcome@466ba01d-75b6-4a10-9941-2c78d6508911.azurecomm.net' },
            to: { emailAddress: email },
            subject: 'Email Verification',
            htmlBody: `<p>Click the following link to verify your email: http://your-verification-url/${token}</p>`,
        };

        // Send the email using Azure Communication Email Service
        const response = await emailClient.send({
            from: sendEmailRequest.from,
            to: sendEmailRequest.to,
            subject: sendEmailRequest.subject,
            body: { content: sendEmailRequest.htmlBody, contentType: "text/html" },
        });

        console.log('Email sent:', response);
    } catch (error) {
        console.error("Error sending email:", error.message);
        // Handle the error as needed, such as logging or sending a response to the client
    }
}

module.exports = { sendVerificationEmail };
